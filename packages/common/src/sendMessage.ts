import { Data, RawMessage, EventName } from './typings'
import { isRawMessage } from './helpers'
import { EVENTS } from './constants'

const SendMessage = (dataChannel: RTCDataChannel, eventName: EventName, data: Data | RawMessage | null = null) => {
  if (dataChannel.readyState === 'open') {
    try {
      if (eventName === EVENTS.RAW_MESSAGE && data !== null && isRawMessage(data)) {
        // @ts-ignore
        dataChannel.send(data)
      } else {
        dataChannel.send(JSON.stringify({ [eventName]: data }))
      }
    } catch (error) {
      console.error('Error => dataChannel.send: ', error.message)
    }
  }
}

export default SendMessage
