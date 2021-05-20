import geckos, { Data, RawMessage } from '@geckos.io/client'

const channel = geckos({ port: 3000, authorization: 'UNIQUE_TOKEN' })

const button = document.getElementById('button')
const text = document.getElementById('text') as HTMLInputElement
const list = document.getElementById('list')

const appendMessage = (msg: Data) => {
  if (list) {
    const li = document.createElement('li')
    li.innerHTML = msg as string
    list.appendChild(li)
  }
}

channel.onConnect(error => {
  if (error) {
    console.error(error.message)
    console.log('Status: ', error.status)
    console.log('StatusText: ', error.statusText)
    appendMessage(error.message)
    return
  } else {
    console.log('You are connected', channel.id)
  }

  channel.emit('chat message', `Hello everyone, I'm ${channel.id}`)

  channel.onDisconnect(() => {
    console.log('You got disconnected')
  })

  if (button)
    button.addEventListener('click', e => {
      if (text) {
        const content = text.value
        if (content && content.trim().length > 0) {
          channel.emit('chat message', content.trim())
          text.value = ''
        }
      }
    })

  channel.on('chat message', (data: Data) => {
    appendMessage(data)
  })

  channel.on('some reliable event', (data: Data) => {
    appendMessage(`[RELIABLE] ${data}`)
  })

  channel.emit('number', 33)

  // send a very important number to the server
  channel.emit('number', 128, { reliable: true })

  channel.onRaw((rawMessage: RawMessage) => {
    console.log('rawMessage', rawMessage)
  })

  // sending a raw message
  setTimeout(() => {
    const buffer = new ArrayBuffer(2)
    const bufferView = new DataView(buffer)
    bufferView.setInt8(0, 5)
    bufferView.setInt8(1, 12)
    channel.raw.emit(buffer)
  }, 5000)
})
