import WebRTCConnection from './webrtcConnection'
import { ChannelId, ServerOptions } from '@geckos.io/common/lib/types'
import { EVENTS } from '@geckos.io/common/lib/constants'
import makeRandomId from '@geckos.io/common/lib/makeRandomId'
import type { IncomingMessage, OutgoingMessage } from 'http'

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

    // create the webrtc connection
    const connection = new WebRTCConnection(this.createId(), this.options, this.connections, userData)
    const pc = connection.peerConnection

    pc.onconnectionstatechange = () => {
      // keep track of the maxMessageSize
      if (pc.connectionState === 'connected') connection.channel.maxMessageSize = pc.sctp?.maxMessageSize

      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        connection.channel.eventEmitter.emit(EVENTS.DISCONNECT, pc.connectionState)
        this.deleteConnection(connection)
      }
    }

    this.connections.set(connection.id, connection)

    // create the offer
    await connection.doOffer()

    const { id, iceConnectionState, peerConnection, remoteDescription, localDescription, signalingState } = connection

    return {
      connection: {
        id,
        iceConnectionState,
        peerConnection,
        remoteDescription,
        localDescription,
        signalingState
      },
      userData,
      status: 200
    }
  }

  deleteConnection(connection: WebRTCConnection) {
    connection.close()
    connection.channel.eventEmitter.removeAllListeners()
    connection.removeAllListeners()

    this.connections.delete(connection.id)
  }
}
