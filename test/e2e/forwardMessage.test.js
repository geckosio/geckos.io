/* eslint-disable sort-imports */
import express  from 'express'
import geckos from '../../packages/server/lib/index.js'
import http  from 'http'
import path from 'path'

import {__dirname} from './_dirname.js'

const io = geckos()
const app = express()

app.use('/', express.static(path.join(__dirname, '../')))

app.listen(5600)
io.listen(5601)

let channel

describe('connection', () => {
  test('connect', done => {
    io.onConnection(ch => {
      channel = ch
      done()
    })
  })

  describe('messages', () => {
    test('should forward message', done => {
      channel.on('forward', (data, senderId) => {
        expect(senderId).toBe(channel.id)
        done()
      })

      channel.forward(channel.roomId).emit('forward', 'forwarded message')
    })

    test('should forward message (reliable)', done => {
      channel.on('forward-reliable', (data, senderId) => {
        expect(senderId).toBe(channel.id)
        done()
      })

      channel.forward(channel.roomId).emit('forward-reliable', 'forwarded message', { reliable: true })
    })
  })
})

page.goto('http://localhost:5600/e2e/forwardMessage.html')

// afterAll(async () => {
//   page.close()
// })
