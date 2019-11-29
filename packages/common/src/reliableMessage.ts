import makeRandomId from './makeRandomId'
import runInterval from './runInterval'

const makeReliable = (options: any, cb: Function) => {
  const { interval = 150, runs = 10 } = options
  const id = makeRandomId(24)
  runInterval(interval, runs, () => {
    cb(id)
  })
}

export { makeReliable }
