import ParseMessage from '@geckos.io/common/lib/parseMessage'
import SendMessage from '@geckos.io/common/lib/sendMessage'
import { Bridge } from '@geckos.io/common/lib/bridge'
import { RawMessage, Data, ChannelId, EventName } from '@geckos.io/common/lib/types'

interface RTCRemotePeerConnection {
  id: ChannelId
  localDescription: RTCSessionDescriptionInit
}

export default class ConnectionsManagerClient {
  public bridge = new Bridge()
  public dataChannel: RTCDataChannel
  public id: ChannelId
  public localPeerConnection: RTCPeerConnection
  public maxMessageSize: number | undefined
  public remotePeerConnection: RTCRemotePeerConnection

  emit(eventName: EventName, data: Data | RawMessage | null = null) {
    SendMessage(this.dataChannel, this.maxMessageSize, eventName, data)
  }

  constructor(
    public url: string,
    public authorization: string | undefined,
    public label: string,
    public rtcConfiguration: RTCConfiguration
  ) {}

  onDataChannel = (ev: RTCDataChannelEvent) => {
    const { channel } = ev

    if (channel.label !== this.label) return

    this.dataChannel = channel

    // set default binaryType to arraybuffer
    // https://github.com/node-webrtc/node-webrtc/issues/441
    this.dataChannel.binaryType = 'arraybuffer'

    this.dataChannel.onmessage = (ev: MessageEvent) => {
      const { key, data } = ParseMessage(ev)
      this.bridge.emit(key, data)
    }
  }

  // fetch additional candidates
  async fetchAdditionalCandidates(host: string, id: ChannelId) {
    const res = await fetch(`${host}/connections/${id}/additional-candidates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (res.ok) {
      const candidates = await res.json()
      candidates.forEach((c: RTCIceCandidateInit) => {
        this.localPeerConnection.addIceCandidate(c)
      })
    }
  }

  async connect() {
    const host = `${this.url}/.wrtc/v2`

    let headers: any = { 'Content-Type': 'application/json' }
    if (this.authorization) headers = { ...headers, ['Authorization']: this.authorization }
    let userData = {}

    try {
      const res = await fetch(`${host}/connections`, {
        method: 'POST',
        headers
      })

      const json = await res.json()

      userData = json.userData

      this.remotePeerConnection = json
    } catch (error) {
      console.error(error.message)
      return { error }
    }

    const { id, localDescription } = this.remotePeerConnection

    /**
     * testing
     */
    // console.log(localDescription.sdp?.split('\n'))
    // remove all host type candidates (for testing)
    // let removedHostCandidates: any[] = []
    // localDescription.sdp = localDescription.sdp
    //   ?.split('\n')
    //   .filter(line => {
    //     if (/typ host/.test(line)) {
    //       console.log('removing', line)
    //       removedHostCandidates.push(line.replace('a=', '').trim())
    //     }
    //     return !/typ host/.test(line)
    //   })
    //   .join('\n')
    // console.log(localDescription.sdp)
    // add all (host) candidates manually
    // setTimeout(() => {
    //   removedHostCandidates.forEach(candidate => {
    //     console.log('try to add candidate: ', candidate)
    //     this.localPeerConnection.addIceCandidate({ candidate, sdpMid: '0', sdpMLineIndex: 0 })
    //   })
    // }, 2000)

    const configuration: RTCConfiguration = {
      // @ts-ignore
      sdpSemantics: 'unified-plan',
      ...this.rtcConfiguration
    }

    const RTCPc =
      RTCPeerConnection ||
      webkitRTCPeerConnection ||
      // @ts-ignore
      mozRTCPeerConnection

    // create rtc peer connection
    this.localPeerConnection = new RTCPc(configuration)

    // get additional ice candidates
    // we do still continue to gather candidates even if the connection is established,
    // maybe we get a better connection.
    // So the server is still gathering candidates and we ask for them frequently.
    const showBackOffIntervals = (attempts = 10, initial = 50, factor = 1.8, jitter = 20) =>
      Array(attempts)
        .fill(0)
        .map(
          (_, index) => parseInt((initial * factor ** index).toString()) + parseInt((Math.random() * jitter).toString())
        )

    showBackOffIntervals().forEach(ms => {
      setTimeout(() => {
        this.fetchAdditionalCandidates(host, id)
      }, ms)
    })

    try {
      await this.localPeerConnection.setRemoteDescription(localDescription)
      this.localPeerConnection.addEventListener('datachannel', this.onDataChannel, { once: true })

      const originalAnswer = await this.localPeerConnection.createAnswer()
      const updatedAnswer = new RTCSessionDescription({
        type: 'answer',
        sdp: originalAnswer.sdp
      })

      await this.localPeerConnection.setLocalDescription(updatedAnswer)

      try {
        await fetch(`${host}/connections/${id}/remote-description`, {
          method: 'POST',
          body: JSON.stringify(this.localPeerConnection.localDescription),
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } catch (error) {
        console.error(error.message)
        return { error }
      }

      const waitForDataChannel = (): Promise<void> => {
        return new Promise(resolve => {
          this.localPeerConnection.addEventListener(
            'datachannel',
            () => {
              resolve()
            },
            { once: true }
          )
        })
      }

      if (!this.dataChannel) await waitForDataChannel()

      return {
        userData,
        localPeerConnection: this.localPeerConnection,
        dataChannel: this.dataChannel,
        id: id
      }
    } catch (error) {
      console.error(error.message)
      this.localPeerConnection.close()
      return { error }
    }
  }
}
