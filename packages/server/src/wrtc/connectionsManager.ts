import CreateDataChannel from '../geckos/channel'
import WebRTCConnection from './webrtcConnection'
import makeRandomId from '@geckos.io/common/lib/makeRandomId'
import type { IncomingMessage, OutgoingMessage } from 'http'
import { ChannelId, ServerOptions } from '@geckos.io/common/lib/types'
import { EVENTS } from '@geckos.io/common/lib/constants'

export default class ConnectionsManagerServer {
  connections: Map<ChannelId, WebRTCConnection> = new Map()

  constructor(public options: ServerOptions) {}

  private createId(): ChannelId {
    do {
      const id = makeRandomId(24)
      if (!this.connections.has(id)) {
        return id
      }
    } while (true)
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
    let userData: any = await this.getUserData(authorization, request, response)
    if (userData._statusCode) return { userData, status: userData._statusCode }

    const newId = this.createId()

    // create the webrtc connection
    const connection = new WebRTCConnection(newId, this.options, this.connections, userData)
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
    let candidates = []

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

    const dc = pc.createDataChannel(this.options.label || 'geckos.io')

    connection.channel = new CreateDataChannel(connection, dc, this.options, userData)

    // test
    const pause = (ms: number): Promise<void> => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve()
        }, ms)
      })
    }

    await pause(50)

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
