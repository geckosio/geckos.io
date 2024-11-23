import { ChannelId, ServerOptions } from '../deps.js'
import { DataChannelInitConfig, RtcConfig, createDataChannel } from './nodeDataChannel.js'
import type { IncomingMessage, OutgoingMessage } from 'http'
import { pause, promiseWithTimeout } from '../deps.js'
import CreateDataChannel from '../geckos/channel.js'
import WebRTCConnection from './webrtcConnection.js'
import { makeRandomId } from '../deps.js'

export default class ConnectionsManagerServer {
  connections: Map<ChannelId, WebRTCConnection> = new Map()

  constructor(public options: ServerOptions) {}

  private createId(): string {
    let id = makeRandomId(24)

    while (this.connections.has(id)) id = makeRandomId(24)

    return id
  }

  getConnection(id: ChannelId): WebRTCConnection | undefined {
    return this.connections.get(id)
  }

  getConnections() {
    return this.connections
  }

  private async getUserData(authorization: string | undefined, request: IncomingMessage, response: OutgoingMessage) {
    // check authorization and get userData
    let userData = {}
    if (this.options?.authorization) {
      if (typeof this.options.authorization !== 'function') {
        console.log('[warning] Authorization is not a function!?')
        return { _statusCode: 500 }
      }

      const res = await this.options.authorization(authorization, request, response)
      if (typeof res === 'boolean' && res) userData = {}
      else if (typeof res === 'boolean' && !res) return { _statusCode: 401 }
      else if (typeof res === 'number' && res >= 100 && res < 600) return { _statusCode: res }
      else userData = res
    }

    return userData
  }

  async createConnection(authorization: string | undefined, request: IncomingMessage, response: OutgoingMessage) {
    // get userData
    const userData: any = await this.getUserData(authorization, request, response)
    if (userData._statusCode) return { userData, status: userData._statusCode }

    const newId = this.createId()

    const {
      ordered = false,
      label = 'geckos.io',
      iceServers = [],
      portRange,
      iceTransportPolicy = 'all',
      bindAddress = undefined,
      maxPacketLifeTime = undefined,
      maxRetransmits = 0,
      multiplex = true
    } = this.options

    // DataChannel configuration
    const dc_config: DataChannelInitConfig = {
      maxPacketLifeTime,
      maxRetransmits,
      unordered: !ordered
    }

    // WebRTCConnection configuration
    let rtc_config: RtcConfig = {
      // sdpSemantics: 'unified-plan',
      iceTransportPolicy: iceTransportPolicy,
      iceServers: iceServers.map((ice: any) => ice.urls as string),
      bindAddress: bindAddress,
      enableIceUdpMux: multiplex
    }

    // portRange is a nonstandard API
    if (portRange?.min && portRange?.max) {
      portRange.min = Math.max(portRange.min, 1025)
      portRange.max = Math.min(portRange.max, 65535)
      rtc_config = { ...rtc_config, portRangeBegin: portRange.min, portRangeEnd: portRange.max }
    }

    // create the webrtc connection
    const connection = new WebRTCConnection(newId, rtc_config, this.connections, userData)
    const pc = await connection.init()

    if (!pc) return { status: 500 }

    pc.onStateChange(async (state: string) => {
      // keep track of the maxMessageSize
      if (state === 'connected') connection.channel.maxMessageSize = +connection.channel.dataChannel.maxMessageSize()

      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        await this.deleteConnection(connection, state)
      }
    })

    let gatheringState
    let localDescription
    const candidates = []

    pc.onDataChannel((dc: any) => {
      // TODO(yandeu) This does not work :/
      console.log('Peer1 Got DataChannel: ', dc.getLabel())
    })

    pc.onGatheringStateChange((state: string) => {
      gatheringState = state
    })

    pc.onLocalDescription((sdp: any, type: any) => {
      localDescription = { sdp, type }
    })

    pc.onLocalCandidate((candidate: any, mid: any) => {
      // @ts-ignore
      connection.additionalCandidates.push({ candidate, sdpMid: mid })
      candidates.push({ candidate, mid })
    })

    const dc = await promiseWithTimeout(createDataChannel(pc, label, dc_config), 2000) // pc.createDataChannel(label, dc_config)

    connection.channel = new CreateDataChannel(connection, dc, this.options, userData)

    let waitForLocalDescription = 0
    while (typeof localDescription === 'undefined' && waitForLocalDescription < 20) {
      waitForLocalDescription++
      await pause(50)
    }

    const { id } = connection
    if (!id) return { status: 500 }

    this.connections.set(id, connection)

    return {
      connection: {
        id,
        localDescription
      },
      userData,
      status: 200
    }
  }

  async deleteConnection(connection: WebRTCConnection, state: string) {
    await connection.close(state)
  }
}
