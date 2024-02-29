module.exports = {
  name: 'options',
  priority: 1,
  requestIntercept (context, interceptOpt, req, res, ssl, next) {
    const { rOptions, log } = context

    if (rOptions.method === 'OPTIONS') {
      res.writeHead(200, {
        // 允许跨域
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': rOptions.headers.origin || '*',
        'Access-Control-Allow-Headers': rOptions.headers['access-control-request-headers'] || '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Max-Age': 2592000,
        Date: new Date().toUTCString(),
        'Dev-Sidecar-Interceptor': 'options'
      })
      res.end()

      const url = `${rOptions.method} ➜ ${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}${req.url}`
      log.info('options intercept:', url, rOptions)
      return true // true代表请求结束
    }
  },
  is (interceptOpt) {
    return true
  }
}
