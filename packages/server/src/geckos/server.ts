import * as Types from '@geckos.io/common/lib/types.js'
import Connection from '../wrtc/connection.js'
import ConnectionsManagerServer from '../wrtc/connectionsManager.js'
import { EVENTS } from '@geckos.io/common/lib/constants.js'
import HttpServer from '../httpServer/httpServer.js'
import ServerChannel from './channel.js'
import WebRTCConnection from '../wrtc/webrtcConnection.js'
import bridge from '@geckos.io/common/lib/bridge.js'
import http from 'http'
import { makeReliable } from '@geckos.io/common/lib/reliableMessage.js'

export class GeckosServer {
  public connectionsManager: ConnectionsManagerServer
  public server: http.Server

  private _port: number
  private _cors: Types.CorsOptions = { origin: '*', allowAuthorization: false }

  constructor(options: Types.ServerOptions) {
    this.connectionsManager = new ConnectionsManagerServer(options)

    // auto adjust allow authorization in cors headers
    if (typeof options.cors?.allowAuthorization === 'undefined' && typeof options.authorization === 'function')
      this._cors.allowAuthorization = true

    // merge cors options
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
      console.log(`Geckos.io signaling server is running on port ${port}`)
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
  emit(eventName: Types.EventName, data: Types.Data, options?: Types.EmitOptions) {
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
  room(roomId: Types.RoomId = undefined) {
    return {
      emit: (eventName: Types.EventName, data: Types.Data) => {
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

  /** Emit a raw message */
  get raw() {
    return {
      emit: (rawMessage: Types.RawMessage) => this.emit(EVENTS.RAW_MESSAGE, rawMessage),
      room: (roomId: Types.RoomId = undefined) => {
        return {
          emit: (rawMessage: Types.RawMessage) => {
            this.room(roomId).emit(EVENTS.RAW_MESSAGE, rawMessage)
          }
        }
      }
    }
  }

  /** Listen for a new connection. */
  onConnection(callback: (channel: ServerChannel) => void) {
    bridge.on(EVENTS.CONNECTION, (channel: ServerChannel) => {
      const cb: (channel: ServerChannel) => void = channel => callback(channel)
      cb(channel)
    })
  }
}

/**
 * The geckos.io server library.
 * @param options Pass the geckos.io server options.
 * @param options.authorization The async authorization callback
 * @param options.autoManageBuffering By default, geckos.io manages RTCDataChannel buffering for you. Default 'true'
 * @param options.cors Set the CORS options.
 * @param options.cors.allowAuthorization Required if the client and server are on separate domains. Default: false
 * @param options.cors.origin String OR (req: http.IncomingMessage) => string. Default '*'
 * @param options.iceServers An array of RTCIceServers. See https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer.
 * @param options.iceTransportPolicy RTCIceTransportPolicy enum defines string constants which can be used to limit the transport policies of the ICE candidates to be considered during the connection process.
 * @param options.label A human-readable name for the channel. This string may not be longer than 65,535 bytes. Default: 'geckos.io'.
 * @param options.maxPacketLifeTime The maximum number of milliseconds that attempts to transfer a message may take in unreliable mode. While this value is a 16-bit unsigned number, each user agent may clamp it to whatever maximum it deems appropriate. Default: null.
 * @param options.maxRetransmits The maximum number of times the user agent should attempt to retransmit a message which fails the first time in unreliable mode. While this value is a16-bit unsigned number, each user agent may clamp it to whatever maximum it deems appropriate. Default: 0.
 * @param options.ordered Indicates whether or not messages sent on the RTCDataChannel are required to arrive at their destination in the same order in which they were sent (true), or if they're allowed to arrive out-of-order (false). Default: false.
 * @param options.portRange Custom port range for the WebRTC connection (available in >= v1.7.0)
 * @param options.portRange.max Default: 65535
 * @param options.portRange.min Default: 0
 */
const geckosServer = (options: Types.ServerOptions = {}) => {
  const { iceTransportPolicy } = options

  if (iceTransportPolicy === 'relay') {
    console.error(`WARNING: iceTransportPolicy "relay" does not work yet on the server!`)
    options.iceTransportPolicy = 'all'
  }

  return new GeckosServer(options)
}

export default geckosServer
export { ServerChannel }
