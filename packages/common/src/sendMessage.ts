import { Data, RawMessage, EventName } from './types'
import { isRawMessage } from './helpers'
import { EVENTS } from './constants'
import sizeof from 'object-sizeof'

const SendMessage = (
  dataChannel: RTCDataChannel,
  maxMessageSize: number | undefined,
  eventName: EventName,
  data: Data | RawMessage | null = null
) => {
  const send = (data: any) => {
    if (typeof maxMessageSize === 'number' && sizeof(data) > maxMessageSize)
      throw new Error(`maxMessageSize of ${maxMessageSize} exceeded`)
    else dataChannel.send(data)
  }

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
