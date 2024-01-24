module.exports = {
  requestIntercept (context, interceptOpts, req, res, ssl, next) {
    const { rOptions, log } = context
    const url = `${rOptions.method} ➜ ${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}${rOptions.path}`
    log.info(`abort: ${url}`)
    res.writeHead(403)
    res.write('DevSidecar 403: Request abort.\n\nThis request is matched by abort intercept.')
    res.end()
    return true// 是否结束
  },
  is (interceptOpt) {
    return !!interceptOpt.abort
  }
}
