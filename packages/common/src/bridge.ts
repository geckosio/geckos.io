import { ChannelId, Data, EventName, EventOptions, RoomId } from './types.js'
import { Events } from '@yandeu/events'

interface BridgeEventMap {
  [key: string]: (data?: Data, options?: EventOptions) => void
}

export class Bridge {
  eventEmitter = new Events<BridgeEventMap>()

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
    return this.eventEmitter.on(eventName, (data, options) => {
      cb(data, options)
    })
  }

  removeAllListeners() {
    this.eventEmitter.removeAllListeners()
  }
}

const bridge = new Bridge()

export default bridge
