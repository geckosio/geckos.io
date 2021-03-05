import { ChannelId, Data, RawMessage } from '@geckos.io/common/lib/types'
import server, { GeckosServer, ServerChannel } from './geckos/server'
import iceServers from '@geckos.io/common/lib/iceServers'

export default server
export { server as geckos, iceServers }
export type { GeckosServer, ServerChannel, Data, RawMessage, ChannelId }
