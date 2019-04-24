import http from 'http'

const SetCORS = (res: http.ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Request-Method', '*')
  res.setHeader('Access-Control-Request-Headers', 'X-Requested-With, accept, content-type')
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
}

export default SetCORS
