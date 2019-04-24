import { ArrayBufferView, RawMessage, Data } from './typings'

const isRawMessage = (data: Data | RawMessage) => {
  return typeof data === 'string' || data instanceof ArrayBuffer || data instanceof ArrayBufferView
}

const isObject = (data: Data) => {
  return typeof data === 'object'
}

const isJSONString = (data: Data) => {
  try {
    if (typeof data !== 'string') return false
    JSON.parse(data)
    return true
  } catch (error) {
    return false
  }
}

export { isRawMessage, isObject, isJSONString }
