import { Data, RawMessage, EventName } from './types'
import { isRawMessage } from './helpers'
import { EVENTS } from './constants'

const SendMessage = (
  dataChannel: any | RTCDataChannel,
  maxMessageSize: number | undefined,
  eventName: EventName,
  data: Data | RawMessage | null = null
) => {
  const send = (data: any) => {
    const bytes = data.byteLength ?? data.length * 2 // (times 2 for characters that uses 2 bytes per char)

    if (typeof maxMessageSize === 'number' && bytes > maxMessageSize) {
      throw new Error(`maxMessageSize of ${maxMessageSize} exceeded`)
    } else {
      Promise.resolve().then(() => {
        dataChannel.send(data)
      })
    }
  }

  console.log('data', data)

  if (dataChannel.readyState === 'open') {
    try {
      if (eventName === EVENTS.RAW_MESSAGE && data !== null && isRawMessage(data)) {
        send(data)
      } else {
        send(JSON.stringify({ [eventName]: data }))
      }
    } catch (error) {
      console.error('Error in sendMessage.ts: ', error.message)
      return error
    }
  }
}

export default SendMessage
