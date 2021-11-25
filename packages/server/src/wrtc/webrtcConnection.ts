import { ChannelId, ServerOptions } from '@geckos.io/common/lib/types.js'
import Channel from '../geckos/channel.js'
import Connection from './connection.js'
import nodeDataChannel from 'node-datachannel'

// strangely something it takes a long time
// so I set it to 10 seconds
const TIME_TO_HOST_CANDIDATES = 10000

export default class WebRTCConnection extends Connection {
  public peerConnection: nodeDataChannel.PeerConnection
  public channel: Channel
  public additionalCandidates: RTCIceCandidate[] = []
  private options: any

  constructor(
    id: ChannelId,
    configuration: nodeDataChannel.RtcConfig,
    public connections: Map<ChannelId, WebRTCConnection>,
    public userData: any
  ) {
    super(id)

    this.options = {
      timeToHostCandidates: TIME_TO_HOST_CANDIDATES
    }

    // this.peerConnection = new DefaultRTCPeerConnection(configuration)
    this.peerConnection = new nodeDataChannel.PeerConnection(id as string, configuration)
  }

  close() {
    if (this.channel.dataChannel?.isOpen()) this.channel.dataChannel.close()
    if (this.peerConnection) this.peerConnection.close()
    super.close()

    // @ts-ignore
    this.channel.dataChannel = null
    // @ts-ignore
    this.peerConnection = null

    nodeDataChannel.cleanup()
  }
}
