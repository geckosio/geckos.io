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

/** The geckos.io server options. */
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
  /** By default, geckos.io manages RTCDataChannel buffering for you. Default 'true' */
  autoManageBuffering?: boolean
  /** Set the CORS options. */
  cors?: CorsOptions
  /** An array of RTCIceServers. See https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer. */
  iceServers?: RTCIceServer[]
  /** RTCIceTransportPolicy enum defines string constants which can be used to limit the transport policies of the ICE candidates to be considered during the connection process. */
  iceTransportPolicy?: RTCIceTransportPolicy
  /** If defined, bind only to the given local address. Default: undefined */
  bindAddress?: string
  /** A human-readable name for the channel. This string may not be longer than 65,535 bytes. Default: 'geckos.io'. */
  label?: string
  /** The maximum number of milliseconds that attempts to transfer a message may take in unreliable mode. While this value is a 16-bit unsigned number, each user agent may clamp it to whatever maximum it deems appropriate. Default: undefined. */
  maxPacketLifeTime?: number
  /** options.maxRetransmits The maximum number of times the user agent should attempt to retransmit a message which fails the first time in unreliable mode. While this value is a16-bit unsigned number, each user agent may clamp it to whatever maximum it deems appropriate. Default: 0. */
  maxRetransmits?: number
  /** Indicates whether or not messages sent on the RTCDataChannel are required to arrive at their destination in the same order in which they were sent (true), or if they're allowed to arrive out-of-order (false). Default: false. */
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
  iceServers?: RTCIceServer[]
  iceTransportPolicy?: RTCIceTransportPolicy
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

/** The CORS options. */
export interface CorsOptions {
  /** Required if the client and server are on separate domains. Default: false */
  allowAuthorization?: boolean
  /** String OR (req: http.IncomingMessage) => string. Default '*' */
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
