module.exports = {
  name: 'success',
  requestIntercept (context, interceptOpt, req, res, ssl, next) {
    const { rOptions, log } = context

    const status = interceptOpt.status || 200

    res.writeHead(status, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Dev-Sidecar-Interceptor': 'success'
    })
    res.write(
      `DevSidecar ${status}: Request success.\n\n` +
      '  This request is matched by success intercept.\n\n' +
      '  因配置success拦截器，本请求直接返回200成功。'
    )
    res.end()

    const url = `${rOptions.method} ➜ ${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}${req.url}`
    log.info('success intercept:', url)
    return true // true代表请求结束
  },
  is (interceptOpt) {
    return !!interceptOpt.success
  }
}
