import http from 'http'

const ArrayBufferView = Object.getPrototypeOf(Object.getPrototypeOf(new Uint8Array())).constructor
export { ArrayBufferView }

export type USVString = string
export type ChannelId = string | undefined
export type EventName = string
export type RoomId = ChannelId
export type Data = string | number | Object
export type Payload = { [eventName: string]: Data }
export type RawMessage = USVString | ArrayBuffer | ArrayBufferView

export interface ServerOptions {
  iceServers?: RTCIceServer[]
  iceTransportPolicy?: RTCIceTransportPolicy
  label?: string
  ordered?: boolean
  maxRetransmits?: number
  maxPacketLifeTime?: number
  cors?: CorsOptions
  autoManageBuffering?: boolean
  authorization?: (header: string) => Promise<boolean | any>
}

export interface ClientOptions {
  iceServers?: RTCIceServer[]
  iceTransportPolicy?: RTCIceTransportPolicy
  url?: string
  authorization?: string | undefined
  port?: number
  label?: string
}

export interface EmitOptions {
  reliable?: boolean
  interval?: number
  runs?: number
}

type CorsOptionsOriginFunction = (req: http.IncomingMessage) => string
export interface CorsOptions {
  origin: string | CorsOptionsOriginFunction
}

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

export interface DisconnectEventCallbackServer {
  (connectionState: 'disconnected' | 'failed' | 'closed'): void
}

export interface EventOptions {
  roomId?: RoomId
  senderId?: ChannelId
  id?: ChannelId
}
