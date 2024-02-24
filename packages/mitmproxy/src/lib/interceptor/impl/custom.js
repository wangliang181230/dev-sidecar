module.exports = {
  name: 'custom',
  requestIntercept (context, interceptOpt, req, res, ssl, next) {
    const { rOptions, log } = context
    const response = interceptOpt.customResponse

    const body = response.html || response.json || response.text || response.body

    const status = response.status || (body == null ? 204 : 200)

    const headers = response.headers || {}
    headers['Dev-Sidecar-Interceptor'] = 'custom'
    if (!headers['Content-Type'] && status !== 204 && status !== 302) {
      if (response.html != null) {
        headers['Content-Type'] = 'text/html; charset=utf-8'
      } else if (response.json != null) {
        headers['Content-Type'] = 'application/json; charset=utf-8'
      } else if (response.text != null || response.body != null) {
        headers['Content-Type'] = 'text/plain; charset=utf-8'
      } else {
        headers['Content-Type'] = 'text/plain; charset=utf-8'
      }
    }
    if (status === 302) {
      if (response.redirect.indexOf('http') === 0) {
        headers.Location = response.redirect
      } else {
        headers.Location = rOptions.protocol + '//' + response.redirect + req.url
      }
    }

    res.writeHead(status, headers)
    if (status !== 204 && status !== 302) {
      res.write(body)
    }
    res.end()

    const url = `${rOptions.method} ➜ ${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}${req.url}`
    log.info('custom intercept:', url, ', options', JSON.stringify(interceptOpt))
    return true // true代表请求结束
  },
  is (interceptOpt) {
    return !!interceptOpt.customResponse
  }
}
