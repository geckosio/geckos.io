import http from 'http'

const ParseBody = async (req: http.IncomingMessage) => {
  return new Promise((resolve, reject) => {
    let body: any = []
    req
      .on('error', error => {
        console.log('ParseBody error: ', error.message)
        reject(error)
      })
      .on('data', chunk => {
        body.push(chunk)
      })
      .on('end', () => {
        const bodyStr = Buffer.concat(body).toString()
        resolve(bodyStr)
      })
  })
}

export default ParseBody
