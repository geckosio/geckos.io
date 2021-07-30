import { ChannelId, Data, RawMessage } from '@geckos.io/common/lib/types.js'
import server, { GeckosServer, ServerChannel } from './geckos/server.js'
import iceServers from '@geckos.io/common/lib/iceServers.js'

export default server
export { server as geckos, iceServers }
export type { GeckosServer, ServerChannel, Data, RawMessage, ChannelId }
