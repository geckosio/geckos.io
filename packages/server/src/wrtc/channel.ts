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
  DisconnectEventCallbackServer,
  EventCallbackRawMessage,
  ServerOptions,
  EmitOptions
} from '@geckos.io/common/lib/typings'
import SendMessage from '@geckos.io/common/lib/sendMessage'
import { makeReliable } from '@geckos.io/common/lib/reliableMessage'

export default class ServerChannel {
  private _roomId: RoomId
  private _id: ChannelId
  private dataChannel: RTCDataChannel
  eventEmitter = new EventEmitter()
  // stores all reliable messages for about 15 seconds
  private receivedReliableMessages: { id: string; timestamp: Date; expire: number }[] = []

  constructor(public webrtcConnection: WebRTCConnection, dataChannelOptions: ServerOptions) {
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
   * Gets the connectionState 'disconnected', 'failed' or 'closed'. See https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/connectionState
   * @param callback The connectionState.
   */
  onDisconnect(callback: DisconnectEventCallbackServer) {
    this.eventEmitter.on(EVENTS.DISCONNECT, (connectionState: 'disconnected' | 'failed' | 'closed') => {
      let cb: DisconnectEventCallbackServer = connectionState => callback(connectionState)
      cb(connectionState)
    })
  }

  /** Close the webRTC connection. */
  close() {
    this.webrtcConnection.close()
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
      emit: (eventName: EventName, data: Data, options?: EmitOptions) => {
        this.webrtcConnection.connections.forEach((connection: WebRTCConnection) => {
          const { channel } = connection
          const { roomId } = channel

          if (roomId === this._roomId) {
            if (options && options.reliable) {
              makeReliable(options, (id: string) =>
                channel.emit(eventName, {
                  MESSAGE: data,
                  RELIABLE: 1,
                  ID: id
                })
              )
            } else {
              channel.emit(eventName, data)
            }
          }
        })
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
      emit: (eventName: EventName, data: Data, options?: EmitOptions) => {
        this.webrtcConnection.connections.forEach((connection: WebRTCConnection) => {
          const { channel } = connection
          const { roomId, id } = channel

          if (roomId === this._roomId && id !== this._id) {
            if (options && options.reliable) {
              makeReliable(options, (id: string) =>
                channel.emit(eventName, {
                  MESSAGE: data,
                  RELIABLE: 1,
                  ID: id
                })
              )
            } else {
              channel.emit(eventName, data)
            }
          }
        })
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
      emit: (eventName: EventName, data: Data, options?: EmitOptions) => {
        this.webrtcConnection.connections.forEach((connection: WebRTCConnection) => {
          const { channel } = connection
          const { roomId: channelRoomId } = channel

          if (roomId === channelRoomId) {
            if (options && options.reliable) {
              makeReliable(options, (id: string) =>
                channel.eventEmitter.emit(
                  eventName,
                  {
                    MESSAGE: data,
                    RELIABLE: 1,
                    ID: id
                  },
                  this._id
                )
              )
            } else {
              channel.eventEmitter.emit(eventName, data, this._id)
            }
          }
        })
      }
    }
  }

  /**
   * Emit a message to the channel.
   * @param eventName The event name.
   * @param data The data to send.
   * @param options EmitOptions
   */
  emit(eventName: EventName, data: Data | null = null, options?: EmitOptions) {
    if (options && options.reliable) {
      makeReliable(options, (id: string) =>
        this._emit(eventName, {
          MESSAGE: data,
          RELIABLE: 1,
          ID: id
        })
      )
    } else {
      this._emit(eventName, data)
    }
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
      emit: (rawMessage: RawMessage) => this.emit(EVENTS.RAW_MESSAGE, rawMessage),
      room: { emit: (rawMessage: RawMessage) => this.room.emit(EVENTS.RAW_MESSAGE, rawMessage) },
      broadcast: { emit: (rawMessage: RawMessage) => this.broadcast.emit(EVENTS.RAW_MESSAGE, rawMessage) }
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
    this.eventEmitter.on(eventName, (data: any, senderId: ChannelId = undefined) => {
      let cb: EventCallbackServer = (data: any, senderId: ChannelId) => callback(data, senderId)
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
          cb(data.MESSAGE, senderId)
        } else {
          // reject message
        }
      } else {
        cb(data, senderId)
      }
    })
  }
}
