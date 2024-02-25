function getMaxAge (interceptOpt) {
  // 秒
  if (interceptOpt.cacheSeconds > 0 || interceptOpt.cacheMaxAge > 0 || interceptOpt.cache > 0) {
    return interceptOpt.cacheSeconds || interceptOpt.cacheMaxAge || interceptOpt.cache
  }
  // 分钟
  if (interceptOpt.cacheMinutes > 0) {
    return interceptOpt.cacheMinutes * 60 // 60
  }
  // 小时
  if (interceptOpt.cacheHours > 0) {
    return interceptOpt.cacheHours * 3600 // 60 * 60
  }
  // 天
  if (interceptOpt.cacheDays > 0) {
    return interceptOpt.cacheDays * 86400 // 60 * 60 * 3600
  }
  // 年
  if (interceptOpt.cacheYears > 0) {
    return interceptOpt.cacheYears * 31536000 // 60 * 60 * 3600 * 365
  }

  return null
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
  },
  getMaxAge
}
