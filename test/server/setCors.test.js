import SetCORS from '../../packages/server/lib/httpServer/setCors.js'

const req = { headers: { host: 'https://somewebsite.com' } }

test('simple as origin', () => {
  const origins = []
  const CorsOptions = { origin: 'https://geckos.io' }
  const res = {
    setHeader: (s, o) => {
      origins.push(o)
    }
  }

  SetCORS(req, res, CorsOptions)
  expect(origins[0]).toBe('https://geckos.io')
})

test('function as origin', () => {
  const origins = []
  const CorsOptions = {
    origin: req => {
      return req.headers.host
    }
  }
  const res = {
    setHeader: (s, o) => {
      origins.push(o)
    }
  }

  SetCORS(req, res, CorsOptions)
  expect(origins[0]).toBe('https://somewebsite.com')
})
