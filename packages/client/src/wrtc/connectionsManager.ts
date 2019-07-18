import bridge from '@geckos.io/common/lib/bridge'
import { EVENTS } from '@geckos.io/common/lib/constants'
import { RawMessage, Data, ChannelId, EventName } from '@geckos.io/common/lib/typings'
import ParseMessage from '@geckos.io/common/lib/parseMessage'
import SendMessage from '@geckos.io/common/lib/sendMessage'

interface RTCRemotePeerConnection {
  id: ChannelId
  localDescription: RTCSessionDescriptionInit
}

export default class ConnectionsManagerClient {
  localPeerConnection: RTCPeerConnection
  remotePeerConnection: RTCRemotePeerConnection
  dataChannel: RTCDataChannel
  id: ChannelId

  emit(eventName: EventName, data: Data | RawMessage | null = null) {
    SendMessage(this.dataChannel, eventName, data)
  }

  constructor(public url: string, public label: string, public rtcConfiguration: RTCConfiguration) {}

  onDataChannel = (ev: RTCDataChannelEvent) => {
    const { channel } = ev

    if (channel.label !== this.label) return

    this.dataChannel = channel

    // set default binaryType to arraybuffer
    // https://github.com/node-webrtc/node-webrtc/issues/441
    this.dataChannel.binaryType = 'arraybuffer'

    this.dataChannel.onmessage = (ev: MessageEvent) => {
      const { key, data } = ParseMessage(ev)
      bridge.emit(key, data)
    }

    bridge.emit(EVENTS.DATA_CHANNEL_IS_OPEN)
  }

  async connect() {
    const host = `${this.url}/.wrtc/v1`

    try {
      const res = await fetch(`${host}/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      this.remotePeerConnection = await res.json()
    } catch (error) {
      console.error(error.message)
    }

    const { id, localDescription } = this.remotePeerConnection

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

    this.localPeerConnection = new RTCPc(configuration)

    try {
      await this.localPeerConnection.setRemoteDescription(localDescription)
      this.localPeerConnection.addEventListener('datachannel', this.onDataChannel)

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
      }

      return {
        localPeerConnection: this.localPeerConnection,
        dataChannel: this.dataChannel,
        id: id
      }
    } catch (error) {
      console.error(error.message)
      this.localPeerConnection.close()
      throw error
    }
  }
}
