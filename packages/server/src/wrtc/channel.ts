import bridge from '@geckos.io/common/lib/bridge'
import WebRTCConnection from './webrtcConnection'
import EventEmitter from 'eventemitter3'
import ParseMessage from '@geckos.io/common/lib/parseMessage'
import { EVENTS } from '@geckos.io/common/lib/constants'
import {
  Data,
  RoomId,
  EventCallbackServer,
  RawMessage,
  ChannelId,
  EventName,
  ConnectionEventCallbackServer,
  EventCallbackRawMessage,
  ServerOptions
} from '@geckos.io/common/lib/typings'
import SendMessage from '@geckos.io/common/lib/sendMessage'

export default class ServerChannel {
  private _roomId: RoomId
  private _id: ChannelId
  private dataChannel: RTCDataChannel
  eventEmitter = new EventEmitter()

  constructor(webrtcConnection: WebRTCConnection, dataChannelOptions: ServerOptions) {
    this._id = webrtcConnection.id
    this._roomId = undefined

    const {
      label = 'geckos.io',
      ordered = false,
      maxRetransmits = 0,
      maxPacketLifeTime = undefined
    } = dataChannelOptions

    this.dataChannel = webrtcConnection.peerConnection.createDataChannel(label, {
      ordered: ordered,
      maxRetransmits: maxRetransmits,
      maxPacketLifeTime: maxPacketLifeTime
    })

    this.dataChannel.binaryType = 'arraybuffer'

    this.dataChannel.onopen = () => {
      this.dataChannel.onmessage = (ev: MessageEvent) => {
        const { key, data } = ParseMessage(ev)
        this.eventEmitter.emit(key, data)
      }

      // if the dataChannel is open we can safely emit that we have a new open connection
      bridge.emit(EVENTS.CONNECTION, this)
    }

    this.dataChannel.onclose = () => {
      this.eventEmitter.removeAllListeners()
    }
  }

  /** Get the channel's id. */
  get id() {
    return this._id
  }

  /** Get the channel's roomId. */
  get roomId() {
    return this._roomId
  }

  /**
   * Listen for the disconnect event.
   * @param callback The event callback.
   */
  onDisconnect(callback: ConnectionEventCallbackServer) {
    this.eventEmitter.on(EVENTS.DISCONNECT, (channel: ServerChannel) => {
      let cb: ConnectionEventCallbackServer = channel => callback(channel)
      cb(channel)
    })
  }

  /** Join a room by its id. */
  join(roomId: RoomId) {
    this._roomId = roomId
  }

  /** Leave the current room. */
  leave() {
    this._roomId = undefined
  }

  /** Emit a message to all channels in the same room. */
  get room() {
    return {
      /**
       * Emit a message to the current room.
       * @param eventName The event name.
       * @param data The data to send.
       */
      emit: (eventName: EventName, data: Data) => {
        bridge.emit(
          EVENTS.SEND_TO_ROOM,
          { [eventName]: data },
          {
            id: this._id,
            roomId: this._roomId
          }
        )
      }
    }
  }

  /** Broadcast a message to all channels in the same room, except the sender's. */
  get broadcast() {
    return {
      /**
       * Emit a broadcasted message.
       * @param eventName The event name.
       * @param data The data to send.
       */
      emit: (eventName: EventName, data: Data) => {
        bridge.emit(
          EVENTS.BROADCAST_MESSAGE,
          { [eventName]: data },
          {
            id: this._id,
            roomId: this._roomId
          }
        )
      }
    }
  }

  /**
   * Forward a message to all channels in a specific room.
   * @param roomId The roomId.
   */
  forward(roomId: RoomId) {
    return {
      /**
       * Emit a forwarded message.
       * @param eventName The event name.
       * @param data The data to send.
       */
      emit: (eventName: EventName, data: Data) => {
        bridge.emit(
          EVENTS.FORWARD_MESSAGE,
          { [eventName]: data },
          {
            roomId: roomId,
            id: this._id
          }
        )
      }
    }
  }

  /**
   * Emit a message to the channel.
   * @param eventName The event name.
   * @param data The data to send.
   */
  emit(eventName: EventName, data: Data | null = null) {
    this._emit(eventName, data)
  }

  private _emit(eventName: EventName, data: Data | RawMessage | null = null) {
    if (!this._roomId || this._roomId === this._roomId)
      if (!this._id || this._id === this._id) {
        SendMessage(this.dataChannel, eventName, data)
      }
  }

  /** Send a raw message. */
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
   * Listen for raw messages.
   * @param callback The event callback.
   */
  onRaw(callback: EventCallbackRawMessage) {
    this.eventEmitter.on(EVENTS.RAW_MESSAGE, (rawMessage: RawMessage) => {
      let cb: EventCallbackRawMessage = (rawMessage: RawMessage) => callback(rawMessage)
      cb(rawMessage)
    })
  }

  /**
   * Listen for a message.
   * @param eventName The event name.
   * @param callback The event callback.
   */
  on(eventName: EventName, callback: EventCallbackServer) {
    this.eventEmitter.on(eventName, (data: Data, senderId: ChannelId = undefined) => {
      let cb: EventCallbackServer = (data: Data, senderId: ChannelId) => callback(data, senderId)
      cb(data, senderId)
    })
  }
}
