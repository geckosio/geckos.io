import EventEmitter from 'eventemitter3'
import { Data, EventOptions, ChannelId, EventName, RoomId } from './types'

export class Bridge {
  eventEmitter = new EventEmitter()

  emit(
    eventName: EventName,
    data?: Data,
    connection: {
      id?: ChannelId
      roomId?: RoomId
      senderId?: ChannelId
    } = {}
  ) {
    this.eventEmitter.emit(eventName, data, connection)
  }

  on(eventName: EventName, cb: Function) {
    return this.eventEmitter.on(eventName, (data: Data, options: EventOptions) => {
      cb(data, options)
    })
  }

  removeAllListeners() {
    this.eventEmitter.removeAllListeners()
  }
}

const bridge = new Bridge()

export default bridge
