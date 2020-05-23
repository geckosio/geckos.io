import EventEmitter from 'eventemitter3'
import { Data, EventOptions, ChannelId, EventName, RoomId } from './typings'

export class Bridge {
  eventEmitter = new EventEmitter()

  emit(
    eventName: EventName,
    data?: Data,
    connection: {
      senderId?: ChannelId
      id?: ChannelId
      roomId?: RoomId
    } = {}
  ) {
    this.eventEmitter.emit(eventName, data, connection)
  }

  on(eventName: EventName, cb: Function) {
    return this.eventEmitter.on(eventName, (data: Data, options: EventOptions) => {
      cb(data, options)
    })
  }

  removeListener(eventName: EventName, emitted: EventEmitter.ListenerFn, context = undefined) {
    this.eventEmitter.removeListener(eventName, emitted, context)
  }

  removeAllListeners() {
    this.eventEmitter.removeAllListeners()
  }
}

const bridge = new Bridge()

export default bridge
