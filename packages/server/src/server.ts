import bridge from '@geckos.io/common/lib/bridge'
import http from 'http'
import ServerChannel from './wrtc/channel'
import { EVENTS } from '@geckos.io/common/lib/constants'
import {
  Data,
  RoomId,
  // EventCallbackServer,
  ConnectionEventCallbackServer,
  // EventOptions,
  EventName,
  ServerOptions,
  CorsOptions,
  EmitOptions
} from '@geckos.io/common/lib/typings'
import { makeReliable } from '@geckos.io/common/lib/reliableMessage'
import Connection from './wrtc/defaultConnection'
import ConnectionsManagerServer from './wrtc/connectionsManager'
import HttpServer from './httpServer/httpServer'
import WebRTCConnection from './wrtc/webrtcConnection'

export class GeckosServer {
  private connectionsManager: ConnectionsManagerServer
  private _port: number
  private _cors: CorsOptions = { origin: '*' }
  public server: http.Server

  constructor(options: ServerOptions) {
    this.connectionsManager = new ConnectionsManagerServer(options)
    this._cors = { ...this._cors, ...options.cors }
  }

  // @ts-ignore
  private get connections() {
    return this.connectionsManager.connections
  }

  /**
   * Make the server listen on a specific port.
   * @param port Default port is 9208.
   */
  listen(port: number = 9208) {
    this._port = port

    // create the server
    this.server = http.createServer()

    // on server close event
    this.server.once('close', () => {
      this.connectionsManager.connections.forEach((connection: Connection) => connection.close())
      bridge.removeAllListeners()
    })

    // add all routes
    HttpServer(this.server, this.connectionsManager, this._cors)

    // start the server
    this.server.listen(port, () => {
      console.log(`Geckos.io signaling server is running on http://localhost:${port}`)
    })
  }

  /**
   * Add a existing http server.
   * @param server Your http.Server.
   */
  public addServer(server: http.Server) {
    this.server = server

    HttpServer(this.server, this.connectionsManager, this._cors)

    // on server close event
    this.server.once('close', () => {
      this.connectionsManager.connections.forEach((connection: Connection) => connection.close())
      bridge.removeAllListeners()
    })
  }

  get port() {
    return this._port
  }

  /**
   * Emit a message to all channels.
   * @param eventName The event name.
   * @param data The data you want to send.
   * @param options EmitOptions
   */
  emit(eventName: EventName, data: Data, options?: EmitOptions) {
    this.connections.forEach((connection: WebRTCConnection) => {
      const { channel } = connection

      if (options && options.reliable) {
        makeReliable(options, (id: string) =>
          channel.emit(eventName, {
            MESSAGE: data,
            RELIABLE: 1,
            ID: id
          })
        )
      } else channel.emit(eventName, data)
    })
  }

  /**
   * Emit a message to a specific room.
   * @param roomId The roomId.
   */
  room(roomId: RoomId = undefined) {
    return {
      emit: (eventName: EventName, data: Data) => {
        this.connections.forEach((connection: WebRTCConnection) => {
          const { channel } = connection
          const { roomId: channelRoomId } = channel

          if (roomId === channelRoomId) {
            channel.emit(eventName, data)
          }
        })
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

  // /**
  //  * Listen for a message.
  //  * @param eventName The event name.
  //  * @param callback The event callback.
  //  */
  // on(eventName: EventName, callback: EventCallbackServer) {
  //   this._on(eventName, callback)
  // }

  // private _on(eventName: EventName, callback: Function = () => {}) {
  //   bridge.on(eventName, (channel: ServerChannel, eventOptions: EventOptions) => {
  //     let cb: any = (channel: ServerChannel, eventOptions: EventOptions) => callback(channel, eventOptions)
  //     cb(channel, eventOptions.senderId)
  //   })
  // }
}

/**
 * The geckos.io server library.
 * @param options Pass the geckos.io server options.
 * @param options.iceServers An array of RTCIceServers. See https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer.
 * @param options.iceTransportPolicy RTCIceTransportPolicy enum defines string constants which can be used to limit the transport policies of the ICE candidates to be considered during the connection process.
 * @param options.label A human-readable name for the channel. This string may not be longer than 65,535 bytes. Default: 'geckos.io'.
 * @param options.ordered Indicates whether or not messages sent on the RTCDataChannel are required to arrive at their destination in the same order in which they were sent (true), or if they're allowed to arrive out-of-order (false). Default: false.
 * @param options.maxPacketLifeTime The maximum number of milliseconds that attempts to transfer a message may take in unreliable mode. While this value is a 16-bit unsigned number, each user agent may clamp it to whatever maximum it deems appropriate. Default: null.
 * @param options.maxRetransmits The maximum number of times the user agent should attempt to retransmit a message which fails the first time in unreliable mode. While this value is a16-bit unsigned number, each user agent may clamp it to whatever maximum it deems appropriate. Default: 0.
 * @param options.cors Set the CORS options.
 * @param options.cors.origin String OR (req: http.IncomingMessage) => string. Default '*'
 * @param options.autoManageBuffering By default, geckos.io manages RTCDataChannel buffering for you. Default 'true'
 */
const geckosServer = (options: ServerOptions = {}) => {
  const { iceTransportPolicy } = options
  if (iceTransportPolicy === 'relay') {
    console.error(`WARNING: iceTransportPolicy "relay" does not work yet on the server!`)
    options.iceTransportPolicy = 'all'
  }

  return new GeckosServer(options)
}

export default geckosServer
export { ServerChannel }
