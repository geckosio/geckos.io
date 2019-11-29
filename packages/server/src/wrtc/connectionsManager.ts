import WebRTCConnection from './webrtcConnection'
import { ChannelId, ServerOptions } from '@geckos.io/common/lib/typings'
import { EVENTS } from '@geckos.io/common/lib/constants'
import makeRandomId from '@geckos.io/common/lib/makeRandomId'

export default class ConnectionsManagerServer {
  connections = new Map()

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

  async createConnection() {
    const connection = new WebRTCConnection(this.createId(), this.options, this.connections)
    const pc = connection.peerConnection

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        connection.channel.eventEmitter.emit(EVENTS.DISCONNECT)
        this.deleteConnection(connection)
      }
    }

    connection.once('closed', () => this.deleteConnection(connection))
    this.connections.set(connection.id, connection)
    return connection
  }

  deleteConnection(connection: WebRTCConnection) {
    connection.close()
    this.connections.delete(connection.id)
  }
}
