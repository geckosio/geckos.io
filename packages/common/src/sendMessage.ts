import { Data, RawMessage, EventName } from './types'
import { EVENTS } from './constants'
import { isBufferMessage, isStringMessage } from './helpers'

const SendMessage = (
  dataChannel: any | RTCDataChannel,
  maxMessageSize: number | undefined,
  eventName: EventName,
  data: Data | RawMessage | null = null
) => {
  const send = (data: any, isBuffer: boolean) => {
    const bytes = data.byteLength ?? data.length * 2 // (times 2 for characters that uses 2 bytes per char)

    if (typeof maxMessageSize === 'number' && bytes > maxMessageSize) {
      throw new Error(`maxMessageSize of ${maxMessageSize} exceeded`)
    } else {
      Promise.resolve()
        .then(() => {
          // server-side (send() does not exist on the server side)
          if (dataChannel.send) dataChannel.send(data)
          else {
            if (!isBuffer) dataChannel.sendMessage(data)
            else dataChannel.sendMessageBinary(Buffer.from(data))
          }
        })
        .catch(error => {
          console.log('error', error)
        })
    }
  }

  if (!dataChannel) return

  if (dataChannel.readyState === 'open' || dataChannel.isOpen?.()) {
    try {
      if (eventName === EVENTS.RAW_MESSAGE && data !== null && (isStringMessage(data) || isBufferMessage(data))) {
        send(data, isBufferMessage(data))
      } else {
        send(JSON.stringify({ [eventName]: data }), false)
      }
    } catch (error) {
      console.error('Error in sendMessage.ts: ', error.message)
      return error
    }
  }
}

export default SendMessage
