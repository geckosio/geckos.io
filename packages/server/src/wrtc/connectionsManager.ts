import WebRTCConnection from './webrtcConnection'
import bridge from '@geckos.io/common/lib/bridge'
import { EventOptions, ChannelId, Payload, ServerOptions } from '@geckos.io/common/lib/typings'
import { EVENTS } from '@geckos.io/common/lib/constants'
import makeRandomId from '@geckos.io/common/lib/makeRandomId'

export default class ConnectionsManagerServer {
  connections = new Map()

  constructor(public options: ServerOptions) {
    // forward a message (includes the channel id of the sender)
    bridge.on(EVENTS.FORWARD_MESSAGE, (payload: Payload, options: EventOptions) => {
      let eventName = Object.keys(payload)[0]
      let data = payload[eventName]
      this.connections.forEach((connection: WebRTCConnection) => {
        const { channel } = connection
        const { roomId } = channel

        if (roomId === options.roomId) {
          channel.eventEmitter.emit(eventName, data, options.id)
        }
      })
    })
    // broadcast a message
    bridge.on(EVENTS.BROADCAST_MESSAGE, (payload: Payload, options: EventOptions) => {
      let eventName = Object.keys(payload)[0]
      let data = payload[eventName]
      this.connections.forEach((connection: WebRTCConnection) => {
        const { channel } = connection
        const { roomId, id } = channel

        if (roomId === options.roomId && id !== options.id) {
          channel.emit(eventName, data)
        }
      })
    })
    // send to all channels in a room
    bridge.on(EVENTS.SEND_TO_ROOM, (payload: Payload, options: EventOptions) => {
      let eventName = Object.keys(payload)[0]
      let data = payload[eventName]
      this.connections.forEach((connection: WebRTCConnection) => {
        const { channel } = connection
        const { roomId } = channel

        if (roomId === options.roomId) {
          channel.emit(eventName, data)
        }
      })
    })
  }

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
    const connection = new WebRTCConnection(this.createId(), this.options)
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
