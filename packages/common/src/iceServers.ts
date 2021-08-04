/**
 * IceServers for development only.
 */
// eslint-disable-next-line no-undef
const defaultIceServers: RTCIceServer[] = [
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
]

export default defaultIceServers
