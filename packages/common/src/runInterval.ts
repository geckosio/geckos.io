const runInterval = (
  interval: number = 200,
  runs: number = 1,
  cb: Function = () => {
    console.error('Please add a callback function to runInterval()')
  }
) => {
  let counter = 0

  const i = setInterval(() => {
    cb()

    counter++
    if (counter === runs - 1) {
      clearInterval(i)
    }
  }, interval)

  cb()
}

export default runInterval
