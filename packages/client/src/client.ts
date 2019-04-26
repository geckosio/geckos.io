import bridge from '@geckos.io/common/lib/bridge'
import { EVENTS } from '@geckos.io/common/lib/constants'
import PeerConnection from './wrtc/peerConnection'
import ConnectionsManagerClient from './wrtc/connectionsManager'
import {
  RawMessage,
  Data,
  EventName,
  EventCallbackClient,
  ConnectionEventCallbackClient,
  EventCallbackRawMessage
} from '@geckos.io/common/lib/typings'

export class ClientChannel {
  private peerConnection: PeerConnection
  private connectionsManager: ConnectionsManagerClient
  private url: string

  constructor(url: string, port: number, label: string) {
    this.url = `${url}:${port}`
    this.connectionsManager = new ConnectionsManagerClient(this.url, label)
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

  /** Emit a message to the server. */
  emit(eventName: EventName, data: Data | null = null) {
    this.connectionsManager.emit(eventName, data)
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
    bridge.on(eventName, (data: Data) => {
      callback(data)
    })
  }
}

/**
 * The geckos.io client library.
 * @param options.url The url of the server. Default: \`${location.protocol}//${location.hostname}\`.
 * @param options.port The port of the server. Default: 9208.
 * @param options.label The label of the DataChannel. Default: 'geckos.io'.
 */
const geckosClient = (options: { url?: string; port?: number; label?: string } = {}) => {
  const { url = `${location.protocol}//${location.hostname}`, port = 9208, label = 'geckos.io' } = options
  return new ClientChannel(url, port, label)
}

export default geckosClient
