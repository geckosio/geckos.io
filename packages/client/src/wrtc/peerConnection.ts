import { ChannelId } from '@geckos.io/common/lib/types.js'
import ConnectionsManagerClient from './connectionsManager.js'
import { ERRORS } from '@geckos.io/common/lib/constants.js'

export default class PeerConnection {
  dataChannel: RTCDataChannel
  id: ChannelId
  localPeerConnection: RTCPeerConnection

  async connect(connectionsManager: ConnectionsManagerClient) {
    const webRTCPcSupported = RTCPeerConnection || webkitRTCPeerConnection // eslint-disable-line no-undef

    if (webRTCPcSupported) {
      const { localPeerConnection, dataChannel, id, userData, error } = await connectionsManager.connect()

      if (error) return { error }

      if (!localPeerConnection || !dataChannel || !id || !userData)
        return { error: new Error('Something went wrong in "await connectionsManager.connect()"') }

      this.localPeerConnection = localPeerConnection
      this.dataChannel = dataChannel
      this.id = id

      return { userData }
    } else {
      const error = new Error(ERRORS.BROWSER_NOT_SUPPORTED)
      console.error(error.message)
      return { error }
    }
  }
}
