const ArrayBufferView = Object.getPrototypeOf(Object.getPrototypeOf(new Uint8Array())).constructor
export { ArrayBufferView }

export type USVString = string
export type ChannelId = string | undefined
export type EventName = string
export type RoomId = ChannelId
export type Data = string | number | Object
export type Payload = { [eventName: string]: Data }
export type RawMessage = USVString | ArrayBuffer | ArrayBufferView

export interface EventCallbackClient {
  (data: Data): void
}

export interface EventCallbackServer {
  (data: Data, senderId?: ChannelId): void
}

export interface EventCallbackRawMessage {
  (rawMessage: RawMessage): void
}

export interface ConnectionEventCallbackClient {
  (error?: Error): void
}

export interface ConnectionEventCallbackServer {
  (channel: any): void
}

export interface EventOptions {
  roomId?: RoomId
  senderId?: ChannelId
  id?: ChannelId
}
