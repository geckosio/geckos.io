import * as Types from '@geckos.io/common/lib/types.js'
import { Bridge } from '@geckos.io/common/lib/bridge.js'
import ConnectionsManagerClient from '../wrtc/connectionsManager.js'
import { EVENTS } from '@geckos.io/common/lib/constants.js'
import PeerConnection from '../wrtc/peerConnection.js'
import { makeReliable } from '@geckos.io/common/lib/reliableMessage.js'

export class ClientChannel {
  public maxMessageSize: number | undefined
  public userData = {}

  private bridge: Bridge
  private connectionsManager: ConnectionsManagerClient
  private peerConnection!: PeerConnection
  // stores all reliable messages for about 15 seconds
  private receivedReliableMessages: { id: string; timestamp: Date; expire: number }[] = []
  private url: string

  constructor(
    url: string,
    authorization: string | undefined,
    port: number | null,
    label: string,
    rtcConfiguration: RTCConfiguration // eslint-disable-line no-undef
  ) {
    this.url = port ? `${url}:${port}` : url
    this.connectionsManager = new ConnectionsManagerClient(this.url, authorization, label, rtcConfiguration)
    this.bridge = this.connectionsManager.bridge

    // remove all event listeners on disconnect
    this.bridge.on(EVENTS.DISCONNECTED, () => this.bridge.removeAllListeners())
  }

  private onconnectionstatechange() {
    const lpc = this.peerConnection.localPeerConnection

    lpc.onconnectionstatechange = () => {
      if (lpc.connectionState === 'disconnected' || lpc.connectionState === 'closed')
        this.bridge.emit(EVENTS.DISCONNECTED)
    }
  }

  /** Get the channel's id. */
  public get id() {
    return this.peerConnection.id
  }

  /** Close the WebRTC connection */
  public close() {
    this.peerConnection.localPeerConnection.close()

    // fire the DISCONNECTED event manually
    this.bridge.emit(EVENTS.DISCONNECTED)

    try {
      const host = `${this.url}/.wrtc/v2`
      fetch(`${host}/connections/${this.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (error: any) {
      console.error(error.message)
    }
  }

  /** Emit a message to the server. */
  emit(eventName: Types.EventName, data: Types.Data | null = null, options?: Types.EmitOptions) {
    if (options && options.reliable) {
      makeReliable(options, (id: string) =>
        this.connectionsManager.emit(eventName, {
          MESSAGE: data,
          RELIABLE: 1,
          ID: id
        })
      )
    } else {
      this.connectionsManager.emit(eventName, data)
    }
  }

  /** Emit a raw message to the server */
  get raw() {
    return {
      /**
       * Emit a raw message.
       * @param rawMessage The raw message. Can be of type 'USVString | ArrayBuffer | ArrayBufferView'
       */
      emit: (rawMessage: Types.RawMessage) => this.emit(EVENTS.RAW_MESSAGE, rawMessage)
    }
  }

  /**
   * Listen for a raw message from the server.
   * @param callback The event callback.
   */
  onRaw(callback: Types.EventCallbackRawMessage) {
    this.bridge.on(EVENTS.RAW_MESSAGE, (rawMessage: Types.RawMessage) => {
      const cb: Types.EventCallbackRawMessage = (rawMessage: Types.RawMessage) => callback(rawMessage)
      cb(rawMessage)
    })
  }

  /**
   * Listen for the connect event.
   * @param callback The event callback.
   */
  async onConnect(callback: Types.ConnectionEventCallbackClient) {
    this.peerConnection = new PeerConnection()

    const response = await this.peerConnection.connect(this.connectionsManager)

    if (response.error) callback(response.error)
    else {
      // set the userData
      if (response.userData) this.userData = response.userData
      // keep track of the maxMessageSize
      this.maxMessageSize = this.connectionsManager.maxMessageSize = (
        this.peerConnection.localPeerConnection as any
      ).sctp?.maxMessageSize
      // init onConnectionStateChange event
      this.onconnectionstatechange()
      // we are now ready
      callback()
    }
  }

  /**
   * Listen for the disconnect event.
   * @param callback The event callback.
   */
  onDisconnect(callback: Types.ConnectionEventCallbackClient) {
    this.bridge.on(EVENTS.DISCONNECTED, callback)
  }

  /**
   * Listen for a message from the server.
   * @param eventName The event name.
   * @param callback The event callback.
   */
  on(eventName: Types.EventName, callback: Types.EventCallbackClient) {
    this.bridge.on(eventName, (data: any) => {
      // check if message is reliable
      // and reject it if it has already been submitted
      const isReliableMessage: boolean = data && data.RELIABLE === 1 && data.ID !== 'undefined'

      const expireTime = 15_000 // 15 seconds

      const deleteExpiredReliableMessages = () => {
        const currentTime = new Date().getTime()
        this.receivedReliableMessages.forEach((msg, index, object) => {
          if (msg.expire <= currentTime) {
            object.splice(index, 1)
          }
        })
      }

      if (isReliableMessage) {
        deleteExpiredReliableMessages()

        if (this.receivedReliableMessages.filter(obj => obj.id === data.ID).length === 0) {
          this.receivedReliableMessages.push({
            id: data.ID,
            timestamp: new Date(),
            expire: new Date().getTime() + expireTime
          })
          callback(data.MESSAGE)
        } else {
          // reject message
        }
      } else {
        callback(data)
      }
    })
  }
}

/**
 * The geckos.io client library.
 * @param options.iceServers An array of RTCIceServers. See https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer.
 * @param options.iceTransportPolicy RTCIceTransportPolicy enum defines string constants which can be used to limit the transport policies of the ICE candidates to be considered during the connection process.
 * @param options.label The label of the DataChannel. Default: 'geckos.io'.
 * @param options.port The port of the server. Default: 9208.
 * @param options.url The url of the server. Default: \`${location.protocol}//${location.hostname}\`.
 */
const geckosClient = (options: Types.ClientOptions = {}) => {
  const {
    authorization = undefined,
    iceServers = [],
    iceTransportPolicy = 'all',
    label = 'geckos.io',
    port = 9208,
    url = `${location.protocol}//${location.hostname}`
  } = options
  return new ClientChannel(url, authorization, port, label, { iceServers, iceTransportPolicy })
}

export default geckosClient
