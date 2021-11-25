import { ChannelId, ServerOptions } from '@geckos.io/common/lib/types.js'
import { PeerConnection, RtcConfig, cleanup } from './nodeDataChannel.js'
import { closeDataChannel, closePeerConnection, createPeerConnection, wait } from './nodeDataChannel.js'
import Channel from '../geckos/channel.js'
import EventEmitter from 'events'
import { promiseWithTimeout } from '@geckos.io/common/lib/helpers'

// strangely something it takes a long time
// so I set it to 10 seconds
const TIME_TO_HOST_CANDIDATES = 10000

export default class WebRTCConnection extends EventEmitter {
  id: ChannelId
  state: 'open' | 'closed'

  public peerConnection: PeerConnection
  public channel: Channel
  public additionalCandidates: RTCIceCandidate[] = []
  private options: any

  constructor(
    id: ChannelId,
    configuration: RtcConfig,
    public connections: Map<ChannelId, WebRTCConnection>,
    public userData: any
  ) {
    super()
    this.id = id
    this.state = 'open'

    this.options = {
      timeToHostCandidates: TIME_TO_HOST_CANDIDATES
    }

    // this.peerConnection = new DefaultRTCPeerConnection(configuration)
    this.peerConnection = createPeerConnection(id as string, configuration)
  }

  async close() {
    await promiseWithTimeout(closeDataChannel(this.channel.dataChannel), 2000)
    await promiseWithTimeout(closePeerConnection(this.peerConnection), 2000)

    // @ts-ignore
    this.channel.dataChannel = null
    // @ts-ignore
    this.peerConnection = null

    await promiseWithTimeout(cleanup(), 2000)
  }
}
