module.exports = {
  name: 'success',
  priority: 101,
  requestIntercept (context, interceptOpt, req, res, ssl, next) {
    const { rOptions, log } = context
    const response = interceptOpt

    const status = response.status || 200

    const body = response.html || response.json || response.script || response.css || response.text || response.body ||
      `DevSidecar ${status}: Request success.\n\n` +
      '  This request is matched by success intercept.\n\n' +
      '  因配置success拦截器，本请求直接返回200成功。'

    // headers
    const headers = response.headers || {}
    headers['Dev-Sidecar-Interceptor'] = 'success'
    // headers.Content-Type
    if (status !== 204) {
      // （1）如果没有Content-Type，根据response的内容自动设置
      if (!headers['Content-Type']) {
        if (response.html != null) {
          headers['Content-Type'] = 'text/html'
        } else if (response.json != null) {
          headers['Content-Type'] = 'application/json'
        } else if (response.script != null) {
          headers['Content-Type'] = 'application/javascript'
        } else if (response.css != null) {
          headers['Content-Type'] = 'text/css'
        } else {
          headers['Content-Type'] = 'text/plain'
        }
      }
      // （2）如果Content-Type没有charset，自动设置为utf-8
      if (headers['Content-Type'] != null && headers['Content-Type'].indexOf('charset') < 0) {
        headers['Content-Type'] += '; charset=utf-8'
      }
    }
    // headers.Access-Control-Allow-*：避免跨域问题
    headers['Access-Control-Allow-Credentials'] = 'true'
    headers['Access-Control-Allow-Origin'] = '*'

    res.writeHead(status, headers)
    if (status !== 204) {
      res.write(body)
    }
    res.end()

    const url = `${rOptions.method} ➜ ${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}${req.url}`
    log.info('success intercept:', url, ', options', JSON.stringify(interceptOpt))
    return true // true代表请求结束
  },
  is (interceptOpt) {
    return !!interceptOpt.success
  }
}
