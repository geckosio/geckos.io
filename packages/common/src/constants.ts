const EVENTS = {
  SEND_OVER_DATA_CHANNEL: 'sendOverDataChannel',
  RECEIVED_FROM_DATA_CHANNEL: 'receiveFromDataChannel',
  DISCONNECTED: 'disconnected',
  DISCONNECT: 'disconnect',
  CONNECTION: 'connection',
  CONNECT: 'connect',
  ERROR: 'error',
  DATA_CHANNEL_IS_OPEN: 'dataChannelIsOpen',
  SEND_TO_ROOM: 'sendToRoom',
  SEND_TO_ALL: 'sendToAll',
  FORWARD_MESSAGE: 'forwardMessage',
  BROADCAST_MESSAGE: 'broadcastMessage',
  RAW_MESSAGE: 'rawMessage'
}

const ERRORS = {
  BROWSER_NOT_SUPPORTED: 'BROWSER_NOT_SUPPORTED',
  COULD_NOT_PARSE_MESSAGE: 'COULD_NOT_PARSE_MESSAGE'
}

export { EVENTS, ERRORS }
