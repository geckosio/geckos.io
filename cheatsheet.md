# Geckos&#46;io Cheatsheet

## Client

```js
// import geckos.io client
import geckos from '@geckos.io/client'

/**
 * start geckos client with these options
 * @param options.url default is `${location.protocol}//${location.hostname}`
 * @param options.port default is 9208
 * @param options.label Default: 'geckos.io'.
 * @param options.iceServers Default: [].
 * @param options.iceTransportPolicy Default: 'all'.
 */
const channel = geckos(options)

// once the channel is connected to the server
channel.onConnect(error => {
  if (error) console.error(error.message)

  // listens for a disconnection
  channel.onDisconnect(() => {})

  // listens for a custom event from the server
  channel.on('chat message', data => {})

  // emits a message to the server
  channel.emit('chat message', 'Hi!')
})
```

## Server

```js
// import geckos.io server
import geckos from '@geckos.io/server'

/**
 * start geckos server with these options
 * @param options.iceServers Default: [].
 * @param options.iceTransportPolicy Default: 'all'.
 * @param options.label Default: 'geckos.io'.
 * @param options.ordered Default: false.
 * @param options.maxPacketLifeTime Default: null.
 * @param options.maxRetransmits Default: 0.
 * @param options.cors
 * @param options.cors.origin String | (req) => string. Default '*'
 */
io = geckos(options)

/**
 * make the server listen on a port
 * @param {number} port default port is 9208
 */
io.listen()

// whenever a new channel is connected
io.onConnection(channel => {
  // the channel includes its id
  const { id } = channel

  // whenever the channel got disconnected
  channel.onDisconnect(() => {})

  // listen for a custom event
  channel.on('chat message', data => {})

  // channel joins a room
  channel.join('someRoomId')

  // channel leaves a room
  channel.leave()

  // will trigger a specific event on all channels in a
  // specific room and add the senderId as a second parameter
  channel.forward(channel.sroomId).emit('chat message', 'Hello!')

  // listen for a forwarded message
  channel.on('chat message', (data, senderId) => {
    // we know that the message was forwarded if senderId is defined
    if (senderId) {
      // ...
    } else {
      // ...
    }
  })

  // emits a message to the channel
  channel.emit('chat message', 'Hello to myself!')

  // emits a message to all channels, in the same room
  channel.room.emit('chat message', 'Hello everyone!')

  // emits a message to all channels, in the same room, except sender
  channel.broadcast.emit('chat message', 'Hello friends!')

  // emits a message to all channels
  io.emit('chat message', 'Hello everyone!')

  // emits a message to all channels in a specific room
  io.room(roomId).emit('chat message', 'Hello everyone!')
})
```

**Note**: The following event names are reserved:

- `sendOverDataChannel`
- `receiveFromDataChannel`
- `disconnected`
- `disconnect`
- `connection`
- `connect`
- `error`
- `dataChannelIsOpen`
- `sendToRoom`
- `sendToAll`
- `forwardMessage`
- `broadcastMessage`
- `rawMessage`

## Raw Messages

You can send and receive `USVString`, `ArrayBuffer` and `ArrayBufferView` using rawMessages.

```js
// send a raw message
channel.raw.emit(rawMessage)

// listen for a raw message
channel.onRaw(rawMessage => {})
```
