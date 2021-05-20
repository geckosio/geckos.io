import type { IncomingMessage, OutgoingMessage } from 'http'

const ArrayBufferView = Object.getPrototypeOf(Object.getPrototypeOf(new Uint8Array())).constructor
export { ArrayBufferView }

export type ChannelId = string | undefined
export type Data = string | number | Object
export type EventName = string
export type Payload = { [eventName: string]: Data }
export type RawMessage = USVString | ArrayBuffer | ArrayBufferView
export type RoomId = ChannelId
export type USVString = string

export interface ServerOptions {
  /**
   * A async function to authenticate and authorize a user.
   * @param auth The authentication token
   * @param request The incoming http request
   * @param response The outgoing http response
   */
  authorization?: (
    auth: string | undefined,
    request: IncomingMessage,
    response: OutgoingMessage
  ) => Promise<boolean | any>
  autoManageBuffering?: boolean
  cors?: CorsOptions
  iceServers?: RTCIceServer[] // eslint-disable-line no-undef
  iceTransportPolicy?: RTCIceTransportPolicy // eslint-disable-line no-undef
  label?: string
  maxPacketLifeTime?: number
  maxRetransmits?: number
  ordered?: boolean
  /** Set a custom port range for the WebRTC connection. */
  portRange?: {
    /** Minimum port range (defaults to 0) */
    min: number
    /** Minimum port range (defaults to 65535) */
    max: number
  }
}

export interface ClientOptions {
  authorization?: string | undefined
  iceServers?: RTCIceServer[] // eslint-disable-line no-undef
  iceTransportPolicy?: RTCIceTransportPolicy // eslint-disable-line no-undef
  label?: string
  port?: number
  url?: string
}

export interface EmitOptions {
  interval?: number
  reliable?: boolean
  runs?: number
}

type CorsOptionsOriginFunction = (req: IncomingMessage) => string
export interface CorsOptions {
  allowAuthorization?: boolean
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

export interface ConnectionError extends Error {
  status: number
  statusText: string
}

export interface ConnectionEventCallbackClient {
  (error?: ConnectionError): void
}

export interface DisconnectEventCallbackServer {
  (connectionState: 'closed' | 'disconnected' | 'failed'): void
}

export interface EventOptions {
  id?: ChannelId
  roomId?: RoomId
  senderId?: ChannelId
}
