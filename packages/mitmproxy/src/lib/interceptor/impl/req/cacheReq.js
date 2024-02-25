function getMaxAge (interceptOpt) {
  return interceptOpt.cacheMaxAge || interceptOpt.cacheSeconds || interceptOpt.cache
}

module.exports = {
  name: 'cacheReq',
  priority: 11,
  requestIntercept (context, interceptOpt, req, res, ssl, next) {
    const { rOptions, log } = context

    // 获取maxAge配置
    const lastModified = req.headers['if-modified-since']
    if (lastModified == null) {
      return // 没有lastModified，不拦截
    }

    // 获取 cache-control 用于判断是否禁用缓存
    const cacheControl = req.headers['cache-control']
    if (cacheControl && (cacheControl.indexOf('no-cache') >= 0 || cacheControl.indexOf('no-store') >= 0)) {
      return // 禁用缓存，不拦截
    }

    let lastModifiedTime
    try {
      lastModifiedTime = new Date(lastModified).getTime()
    } catch (e) {
      // 为数字时
      if (/\\d+/g.test(lastModified)) {
        lastModifiedTime = lastModified
      }

      if (lastModifiedTime == null) {
        log.error(`cache intercept: 解析 if-modified-since 失败: '${lastModified}', error:`, e)
        return
      }
    }

    const maxAge = getMaxAge(interceptOpt)

    // 判断缓存是否过期
    const passTime = Date.now() - lastModifiedTime
    if (passTime > maxAge * 1000) {
      return // 缓存已过期，不拦截
    }

    // 缓存未过期，直接拦截请求并响应304
    res.writeHead(304, {
      'Dev-Sidecar-Interceptor': 'cacheReq'
    })
    res.end()

    const url = `${rOptions.method} ➜ ${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}${req.url}`
    log.info('cache intercept:', url)
    return true
  },
  is (interceptOpt) {
    const maxAge = getMaxAge(interceptOpt)
    return maxAge != null && maxAge > 0
  }
}
