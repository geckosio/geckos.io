import { EVENTS, ERRORS } from './constants'
import { isRawMessage, isJSONString } from './helpers'

const ParseMessage = (ev: MessageEvent) => {
  let { data } = ev
  let key
  let parsedData
  let JSONString = isJSONString(data)

  if (!JSONString && isRawMessage(data)) {
    key = EVENTS.RAW_MESSAGE
    parsedData = data
  } else if (JSONString) {
    data = JSON.parse(data)
    key = Object.keys(data)[0]
    parsedData = data[key]
  } else {
    key = 'error'
    parsedData = new Error(ERRORS.COULD_NOT_PARSE_MESSAGE)
  }

  return { key: key, data: parsedData }
}

export default ParseMessage
