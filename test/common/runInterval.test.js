const runInterval = require('../../packages/common/lib/runInterval').default

jest.spyOn(global.console, 'error')

test('interval should run 5 times', done => {
  let runs = 0
  runInterval(50, 5, () => {
    runs++
  })
  setTimeout(() => {
    expect(runs).toBe(5)
    done()
  }, 500)
})

test('throws error if no callback provided', done => {
  runInterval(50, 5, 0)
  setTimeout(() => {
    expect(console.error).toBeCalled()
    done()
  }, 500)
})
