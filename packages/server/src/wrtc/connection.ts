import { ChannelId } from '@geckos.io/common/lib/types.js'
import { EventEmitter } from 'events'

export default class Connection extends EventEmitter {
  id: ChannelId
  state: 'open' | 'closed'

  constructor(id: ChannelId) {
    super()
    this.id = id
    this.state = 'open'
  }

  close() {
    this.state = 'closed'
    this.emit('closed')
  }
}
