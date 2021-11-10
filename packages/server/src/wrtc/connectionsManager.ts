import { ChannelId, ServerOptions } from '@geckos.io/common/lib/types.js'
import type { DataChannelInitConfig, RtcConfig } from 'node-datachannel'
import type { IncomingMessage, OutgoingMessage } from 'http'
import CreateDataChannel from '../geckos/channel.js'
import { EVENTS } from '@geckos.io/common/lib/constants.js'
import WebRTCConnection from './webrtcConnection.js'
import makeRandomId from '@geckos.io/common/lib/makeRandomId.js'
import { pause } from '@geckos.io/common/lib/helpers.js'

export default class ConnectionsManagerServer {
  connections: Map<ChannelId, WebRTCConnection> = new Map()

  constructor(public options: ServerOptions) {}

  private createId(): ChannelId {
    let id = makeRandomId(24)

    while (this.connections.has(id)) id = makeRandomId(24)

    return id
  }

  getConnection(id: ChannelId) {
    return this.connections.get(id) || null
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
      maxPacketLifeTime = undefined,
      maxRetransmits = 0
    } = this.options

    // DataChannel configuration
    const dc_config: DataChannelInitConfig = {
      maxPacketLifeTime,
      maxRetransmits,
      reliability: {
        unordered: !ordered
      }
    }

    // WebRTCConnection configuration
    let rtc_config: RtcConfig = {
      // sdpSemantics: 'unified-plan',
      iceTransportPolicy: iceTransportPolicy,
      iceServers: iceServers.map(ice => ice.urls as string)
    }

    // portRange is a nonstandard API
    if (portRange?.min && portRange?.max)
      rtc_config = { ...rtc_config, portRangeBegin: portRange.min, portRangeEnd: portRange.max }

    // create the webrtc connection
    const connection = new WebRTCConnection(newId, rtc_config, this.connections, userData)
    const pc = connection.peerConnection

    pc.onStateChange(state => {
      // keep track of the maxMessageSize
      if (state === 'connected') connection.channel.maxMessageSize = +connection.channel.dataChannel.maxMessageSize()

      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.deleteConnection(connection, state)
      }
    })

    this.connections.set(connection.id, connection)

    let gatheringState
    let localDescription
    const candidates = []

    pc.onDataChannel(dc => {
      // TODO(yandeu) This does not work :/
      console.log('Peer1 Got DataChannel: ', dc.getLabel())
    })

    pc.onGatheringStateChange(state => {
      gatheringState = state
    })

    pc.onLocalDescription((sdp, type) => {
      localDescription = { sdp, type }
    })

    pc.onLocalCandidate((candidate, mid) => {
      // @ts-ignore
      connection.additionalCandidates.push({ candidate, sdpMid: mid })
      candidates.push({ candidate, mid })
    })

    const dc = pc.createDataChannel(label, dc_config)

    connection.channel = new CreateDataChannel(connection, dc, this.options, userData)

    let waitForLocalDescription = 0
    while (typeof localDescription === 'undefined' && waitForLocalDescription < 20) {
      waitForLocalDescription++
      await pause()
    }

    const { id } = connection

    return {
      connection: {
        id,
        localDescription
      },
      userData,
      status: 200
    }
  }

  deleteConnection(connection: WebRTCConnection, state: string) {
    connection.close()

    connection.channel.eventEmitter.on(EVENTS.DISCONNECT, () => {
      connection.removeAllListeners()
      connection.channel.eventEmitter.removeAllListeners()
    })

    connection.channel.eventEmitter.emit(EVENTS.DISCONNECT, state)

    if (this.connections.get(connection.id)) this.connections.delete(connection.id)
  }
}
