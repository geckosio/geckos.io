import { EVENTS, ERRORS } from './constants'
import { isBufferMessage, isJSONMessage, isStringMessage } from './helpers'

const ParseMessage = (ev: MessageEvent) => {
  let { data } = ev
  if (!data) data = ev

  // console.log('data', data)

  const isBuffer = isBufferMessage(data)
  // console.log('isBuffer', isBuffer)

  const isJson = isJSONMessage(data)
  // console.log('isJson', isJson)

  const isString = isStringMessage(data)
  // console.log('isString', isString)

  // if (!data && isRaw) return { key: EVENTS.RAW_MESSAGE, data }

  // console.log('here?')

  // // probably server-side
  // if (!data) {
  //   if (isRawMessage(data)) {
  //     return { key: EVENTS.RAW_MESSAGE, data: data }
  //   } else {
  //     const json = JSON.parse(data as any)
  //     const key = Object.keys(json)[0]
  //     const value = Object.values(json)[0]
  //     return { key: key, data: value }
  //   }
  // }

  if (isJson) {
    const object = JSON.parse(data)
    const key = Object.keys(object)[0]
    const value = object[key]
    return { key: key, data: value }
  }

  if (isBuffer) {
    return { key: EVENTS.RAW_MESSAGE, data: data }
  }

  if (isString) {
    return { key: EVENTS.RAW_MESSAGE, data: data }
  }

  return { key: 'error', data: new Error(ERRORS.COULD_NOT_PARSE_MESSAGE) }
}

export default ParseMessage
