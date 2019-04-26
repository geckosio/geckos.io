import geckos, { Data, RawMessage } from '@geckos.io/client'

const channel = geckos({ port: 3000 })

const button = document.getElementById('button')
const text = document.getElementById('text') as HTMLInputElement
const list = document.getElementById('list')

const appendMessage = (msg: Data) => {
  if (list) {
    let li = document.createElement('li')
    li.innerHTML = msg as string
    list.appendChild(li)
  }
}

channel.onConnect(error => {
  if (error) {
    console.error(error.message)
    appendMessage(error.message)
    return
  } else {
    console.log('You are connected')
  }

  channel.emit('chat message', `Hello everyone, I\'m ${channel.id}`)

  channel.onDisconnect(() => {
    console.log('You got disconnected')
  })

  if (button)
    button.addEventListener('click', e => {
      if (text) {
        let content = text.value
        if (content && content.trim().length > 0) {
          channel.emit('chat message', content.trim())
          text.value = ''
        }
      }
    })

  channel.on('chat message', (data: Data) => {
    appendMessage(data)
  })

  channel.emit('number', 33)

  channel.onRaw((rawMessage: RawMessage) => {
    console.log('rawMessage', rawMessage)
  })

  // sending a raw message
  setTimeout(() => {
    let buffer = new ArrayBuffer(2)
    let bufferView = new DataView(buffer)
    bufferView.setInt8(0, 5)
    bufferView.setInt8(1, 12)
    channel.raw.emit(buffer)
  }, 5000)
})
