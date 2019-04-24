import bridge from '@geckos.io/common/lib/bridge'
import http from 'http'
import ServerChannel from './wrtc/channel'
import { EVENTS } from '@geckos.io/common/lib/constants'
import {
  Data,
  RoomId,
  EventCallbackServer,
  ConnectionEventCallbackServer,
  EventOptions,
  EventName
} from '@geckos.io/common/lib/typings'
import Connection from './wrtc/defaultConnection'
import ConnectionsManagerServer from './wrtc/connectionsManager'
import HttpServer from './httpServer/httpServer'

export class GeckosServer {
  private connectionsManager: ConnectionsManagerServer
  private _port: number

  constructor(options: { iceServers?: RTCIceServer[] }) {
    const { iceServers = [] } = options
    this.connectionsManager = new ConnectionsManagerServer()
    this.connectionsManager.iceServers = iceServers
  }

  /**
   * Make the server listen on a specific port.
   * @param port Default port is 9208.
   */
  listen(port: number = 9208) {
    this._port = port

    // create the server
    let server = http.createServer()

    // add all routes
    HttpServer(server, this.connectionsManager)

    // start the server
    server.listen(port, () => {
      console.log(`geckos signaling server is running on http://localhost:${port}`)
      server.once('close', () => {
        this.connectionsManager.connections.forEach((connection: Connection) => connection.close())
      })
    })
  }

  // TODO(yandeu) this does not work yet
  public addServer(server: http.Server) {
    console.log(`NOTE: addServer() does not work well yet!`)
    HttpServer(server, this.connectionsManager)
  }

  get port() {
    return this._port
  }

  /**
   * Emit a message to all channels.
   * @param eventName The event name.
   * @param data The data you want to send.
   */
  emit(eventName: EventName, data: Data) {
    bridge.emit(EVENTS.SEND_TO_ALL, { [eventName]: data })
  }

  /**
   * Emit a message to a specific room.
   * @param roomId The roomId.
   */
  room(roomId: RoomId = undefined) {
    return {
      emit: (eventName: EventName, data: Data) => {
        bridge.emit(
          EVENTS.SEND_TO_ROOM,
          { [eventName]: data },
          {
            roomId: roomId
          }
        )
      }
    }
  }

  /** Listen for a new connection. */
  onConnection(callback: ConnectionEventCallbackServer) {
    bridge.on(EVENTS.CONNECTION, (channel: ServerChannel) => {
      let cb: ConnectionEventCallbackServer = channel => callback(channel)
      cb(channel)
    })
  }

  /**
   * Listen for a message.
   * @param eventName The event name.
   * @param callback The event callback.
   */
  on(eventName: EventName, callback: EventCallbackServer) {
    this._on(eventName, callback)
  }

  private _on(eventName: EventName, callback: Function = () => {}) {
    bridge.on(eventName, (channel: ServerChannel, eventOptions: EventOptions) => {
      let cb: any = (channel: ServerChannel, eventOptions: EventOptions) => callback(channel, eventOptions)
      cb(channel, eventOptions.senderId)
    })
  }
}

/**
 * The geckos.io server library.
 * @param options.iceServers An array of RTCIceServers. See https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer.
 */
const geckosServer = (options: { iceServers?: RTCIceServer[] } = {}) => {
  return new GeckosServer(options)
}

export default geckosServer
export { ServerChannel }
