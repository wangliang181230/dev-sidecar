const allowMethods = 'GET,POST,PUT,PATCH,DELETE,OPTIONS,TRACE,HEAD'

module.exports = {
  name: 'options',
  priority: 1,
  requestIntercept (context, interceptOpt, req, res, ssl, next) {
    const { rOptions, log } = context

    if (rOptions.method === 'OPTIONS') {
      res.writeHead(200, {
        // 允许跨域
        'Dev-Sidecar-Interceptor': 'options',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': rOptions.headers.origin || '*',
        'Access-Control-Allow-Headers': rOptions.headers['access-control-request-headers'] || '*',
        'Access-Control-Allow-Methods': allowMethods,
        'Access-Control-Max-Age': 2592000, // 有效一个月
        Allow: allowMethods,
        Date: new Date().toUTCString()
      })
      res.end()

      log.info('options intercept:', (rOptions.original || rOptions).url)
      return true // true代表请求结束
    }
  },
  is (interceptOpt) {
    return !!interceptOpt.options
  }
}
