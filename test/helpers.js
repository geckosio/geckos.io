/** Immediately kill the server. */
export const kill = async (httpServer, sockets = new Set()) => {
  for (const socket of sockets) {
    socket.destroy()
    sockets.delete(socket)
  }

  return new Promise(resolve => {
    httpServer.close(() => {
      return resolve()
    })
  })
}
