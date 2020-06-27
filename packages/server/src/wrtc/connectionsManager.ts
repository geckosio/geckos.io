import WebRTCConnection from './webrtcConnection'
import { ChannelId, ServerOptions } from '../../../common/lib/types'
import { EVENTS } from '@geckos.io/common/lib/constants'
import makeRandomId from '@geckos.io/common/lib/makeRandomId'

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

  getConnection = (id: ChannelId) => {
    return this.connections.get(id) || null
  }

  getConnections = () => {
    // TODO(yandeu) getConnections() does not return anything yet
    return
  }

  async createConnection(authorization: string | undefined) {
    if (authorization) {
      const res = await this.options?.authorization?.(authorization)
      if (!res) return 'unauthorized'
    }

    const connection = new WebRTCConnection(this.createId(), this.options, this.connections)
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
    return connection
  }

  deleteConnection(connection: WebRTCConnection) {
    connection.close()
    connection.channel.eventEmitter.removeAllListeners()
    connection.removeAllListeners()

    this.connections.delete(connection.id)
  }
}
