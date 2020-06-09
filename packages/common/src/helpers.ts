import { ArrayBufferView, RawMessage, Data } from './types'

const isRawMessage = (data: Data | RawMessage) => {
  return typeof data === 'string' || data instanceof ArrayBuffer || data instanceof ArrayBufferView
}

const isObject = (data: Data) => {
  return typeof data === 'object'
}

const isJSONString = (data: Data) => {
  try {
    // check if it is a string
    if (typeof data !== 'string') return false
    // check if it is a number as a string
    if (!isNaN(parseInt(data))) return false
    // check if it is a JSON object
    JSON.parse(data)
    return true
  } catch (error) {
    return false
  }
}

export { isRawMessage, isObject, isJSONString }
