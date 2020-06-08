const EVENTS = {
  SEND_OVER_DATA_CHANNEL: 'sendOverDataChannel',
  RECEIVED_FROM_DATA_CHANNEL: 'receiveFromDataChannel',
  DISCONNECTED: 'disconnected',
  DISCONNECT: 'disconnect',
  CONNECTION: 'connection',
  CONNECT: 'connect',
  ERROR: 'error',
  DATA_CHANNEL_IS_OPEN: 'dataChannelIsOpen',
  RAW_MESSAGE: 'rawMessage',
  DROP: 'dropped'
}

const ERRORS = {
  BROWSER_NOT_SUPPORTED: 'BROWSER_NOT_SUPPORTED',
  COULD_NOT_PARSE_MESSAGE: 'COULD_NOT_PARSE_MESSAGE',
  DROPPED_FROM_BUFFERING: 'DROPPED_FROM_BUFFERING'
}

export { EVENTS, ERRORS }
