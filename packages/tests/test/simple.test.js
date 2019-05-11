const geckos = require('../../server/lib').default
const io = geckos()

const express = require('express')
const path = require('path')
const app = express()

app.use('/static', express.static(path.join(__dirname, '../../../bundles/latest')))
app.get('/simple.html', (req, res) => res.sendFile(path.join(__dirname, 'simple.html')))

app.listen(3033)
io.listen(8888)
jest.setTimeout(5000)

let channel

describe('connection', () => {
  test('connect', done => {
    io.onConnection(ch => {
      channel = ch
      done()
    })
  })

  describe('messages', () => {
    test('chat message should be "Hello"', done => {
      channel.on('chat message 1', () => {
        channel.room.emit('chat message 2')
      })
      channel.on('chat message 2', data => {
        expect(data).toBe('Hello 2')
        done()
      })
    })
  })
})

page.goto('http://localhost:3033/simple.html')

afterAll(async () => {
  app.removeAllListeners()
  page.close()
})
