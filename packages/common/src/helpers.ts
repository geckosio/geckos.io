import { ArrayBufferView, Data, RawMessage } from './types.js'

// const isRawMessage = (data: Data | RawMessage) => {
//   return typeof data === 'string' || isBufferMessage(data)
// }

// https://dev.to/nikosanif/create-promises-with-timeout-error-in-typescript-fmm
/** create a promise with a timeout */
export const promiseWithTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  timeoutError = new Error('Promise timed out')
): Promise<T> => {
  // create a promise that rejects in milliseconds
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(timeout)
    }, ms)
  })

  // returns a race between timeout and the passed promise
  return Promise.race<T>([promise, timeout])
}

/** make a small promise-based pause */
export const pause = (ms: number = 0): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

/** creates a new Task using setTimeout() */
export const task = (task: () => void) => setTimeout(task, 0)

/** creates a new Microtask using Promise() */
export const tick = typeof Promise == 'function' ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout

const isStringMessage = (data: any) => {
  return typeof data === 'string'
}

const isBufferMessage = (data: any) => {
  return data instanceof ArrayBuffer || data instanceof ArrayBufferView
}

const isJSONMessage = (data: Data) => {
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

export { isStringMessage, isBufferMessage, isJSONMessage }
