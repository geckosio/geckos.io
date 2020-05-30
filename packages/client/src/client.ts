import bridge from '@geckos.io/common/lib/bridge'
import { makeReliable } from '@geckos.io/common/lib/reliableMessage'
import { EVENTS } from '@geckos.io/common/lib/constants'
import PeerConnection from './wrtc/peerConnection'
import ConnectionsManagerClient from './wrtc/connectionsManager'
import {
  RawMessage,
  Data,
  EventName,
  EventCallbackClient,
  ConnectionEventCallbackClient,
  EventCallbackRawMessage,
  ClientOptions,
  EmitOptions
} from '@geckos.io/common/lib/typings'

export class ClientChannel {
  private peerConnection: PeerConnection
  private connectionsManager: ConnectionsManagerClient
  private url: string
  // stores all reliable messages for about 15 seconds
  private receivedReliableMessages: { id: string; timestamp: Date; expire: number }[] = []

  constructor(url: string, port: number, label: string, rtcConfiguration: RTCConfiguration) {
    this.url = `${url}:${port}`
    this.connectionsManager = new ConnectionsManagerClient(this.url, label, rtcConfiguration)

    // remove all event listeners on disconnect
    bridge.on(EVENTS.DISCONNECTED, () => bridge.removeAllListeners())
  }

  private onconnectionstatechange() {
    let lpc = this.peerConnection.localPeerConnection

    lpc.onconnectionstatechange = () => {
      if (lpc.connectionState === 'disconnected' || lpc.connectionState === 'closed') bridge.emit(EVENTS.DISCONNECTED)
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
    bridge.emit(EVENTS.DISCONNECTED)

    try {
      const host = `${this.url}/.wrtc/v1`
      fetch(`${host}/connections/${this.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      console.error(error.message)
    }
  }

  /** Emit a message to the server. */
  emit(eventName: EventName, data: Data | null = null, options?: EmitOptions) {
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
      emit: (rawMessage: RawMessage) => this.emit(EVENTS.RAW_MESSAGE, rawMessage)
    }
  }

  /**
   * Listen for a raw message from the server.
   * @param callback The event callback.
   */
  onRaw(callback: EventCallbackRawMessage) {
    bridge.on(EVENTS.RAW_MESSAGE, (rawMessage: RawMessage) => {
      let cb: EventCallbackRawMessage = (rawMessage: RawMessage) => callback(rawMessage)
      cb(rawMessage)
    })
  }

  /**
   * Listen for the connect event.
   * @param callback The event callback.
   */
  async onConnect(callback: ConnectionEventCallbackClient) {
    // TODO(yandeu) add a connection timeout (or something like this)
    bridge.on(EVENTS.DATA_CHANNEL_IS_OPEN, () => {
      callback()
    })

    this.peerConnection = new PeerConnection()

    const error = await this.peerConnection.connect(this.connectionsManager)

    if (error) callback(error)
    else this.onconnectionstatechange()
  }

  /**
   * Listen for the disconnect event.
   * @param callback The event callback.
   */
  onDisconnect(callback: ConnectionEventCallbackClient) {
    bridge.on(EVENTS.DISCONNECTED, callback)
  }

  /**
   * Listen for a message from the server.
   * @param eventName The event name.
   * @param callback The event callback.
   */
  on(eventName: EventName, callback: EventCallbackClient) {
    bridge.on(eventName, (data: any) => {
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
 * @param options.url The url of the server. Default: \`${location.protocol}//${location.hostname}\`.
 * @param options.port The port of the server. Default: 9208.
 * @param options.label The label of the DataChannel. Default: 'geckos.io'.
 * @param options.iceServers An array of RTCIceServers. See https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer.
 * @param options.iceTransportPolicy RTCIceTransportPolicy enum defines string constants which can be used to limit the transport policies of the ICE candidates to be considered during the connection process.
 */
const geckosClient = (options: ClientOptions = {}) => {
  const {
    iceServers = [],
    iceTransportPolicy = 'all',
    url = `${location.protocol}//${location.hostname}`,
    port = 9208,
    label = 'geckos.io'
  } = options
  return new ClientChannel(url, port, label, { iceServers, iceTransportPolicy })
}

export default geckosClient
