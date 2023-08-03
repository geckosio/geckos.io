const runInterval = (interval: number = 200, runs: number = 1, cb: Function) => {
  let counter = 0

  if (typeof cb !== 'function') {
    console.error('You have to define your callback function!')
    return
  }

  const i = setInterval(() => {
    cb()

    counter++
    if (counter === runs - 1) {
      clearInterval(i)
    }
  }, interval)

  cb()
}

export { runInterval}
