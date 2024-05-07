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

export const serverListenPromise = (httpServer, port) => {
  return new Promise(resolve => {
    httpServer.listen(port, () => {
      console.log('listening on port', port)
      resolve()
    })
  })
}

export const sleep = (ms = 1000) => new Promise(r => setTimeout(r, ms))
