const cacheReq = require('../req/cacheReq')

module.exports = {
  name: 'cacheRes',
  priority: 201,
  responseIntercept (context, interceptOpt, req, res, proxyReq, proxyRes, ssl, next) {
    const { rOptions, log } = context

    // 只有GET请求，且响应码为2xx时才进行缓存
    if (rOptions.method !== 'GET' || proxyRes.statusCode < 200 || proxyRes.statusCode >= 300) {
      // res.setHeader('Dev-Sidecar-Cache-Response-Interceptor', `skip: 'method' or 'status' not match`)
      return
    }

    // 获取maxAge配置
    const maxAge = cacheReq.getMaxAge(interceptOpt)
    // public 或 private
    const cacheControlType = (interceptOpt.cacheControlType || 'public') + ', '
    // immutable属性
    const cacheImmutable = interceptOpt.cacheImmutable !== false ? ', immutable' : ''

    // 获取原响应头中的cache-control、last-modified、expires
    const originalHeaders = {
      cacheControl: null,
      lastModified: null,
      expires: null,
      etag: null
    }
    for (let i = 0; i < proxyRes.rawHeaders.length; i += 2) {
      // 尝试修改rawHeaders中的cache-control、last-modified、expires
      if (proxyRes.rawHeaders[i].toLowerCase() === 'cache-control') {
        originalHeaders.cacheControl = { value: proxyRes.rawHeaders[i + 1], valueIndex: i + 1 }
      } else if (proxyRes.rawHeaders[i].toLowerCase() === 'last-modified') {
        originalHeaders.lastModified = { value: proxyRes.rawHeaders[i + 1], valueIndex: i + 1 }
      } else if (proxyRes.rawHeaders[i].toLowerCase() === 'expires') {
        originalHeaders.expires = { value: proxyRes.rawHeaders[i + 1], valueIndex: i + 1 }
      } else if (proxyRes.rawHeaders[i].toLowerCase() === 'etag') {
        originalHeaders.etag = { value: proxyRes.rawHeaders[i + 1], valueIndex: i + 1 }
      }

      // 如果已经设置了cache-control、last-modified、expires，则直接break
      if (originalHeaders.cacheControl && originalHeaders.lastModified && originalHeaders.expires && originalHeaders.etag) {
        break
      }
    }

    const url = cacheReq.generateUrl(rOptions, log)

    // 判断原max-age是否大于新max-age
    if (originalHeaders.cacheControl) {
      const maxAgeMatch = originalHeaders.cacheControl.value.match(/max-age=(\d+)/)
      if (maxAgeMatch && maxAgeMatch[1] > maxAge) {
        res.setHeader('Dev-Sidecar-Cache-Response-Interceptor', `skip: ${maxAgeMatch[1]} > ${maxAge}`)
        log.info(`cache response intercept: skip: ${maxAgeMatch[1]} > ${maxAge}, url: ${url}`)
        return
      }
    }

    // 替换用的头信息
    const now = new Date()
    const replaceHeaders = {
      cacheControl: `${cacheControlType}max-age=${maxAge + 1}${cacheImmutable}`,
      lastModified: now.toUTCString(),
      expires: new Date(now.getTime() + maxAge * 1000).toUTCString()
    }
    // 开始替换
    // 替换cache-control
    if (originalHeaders.cacheControl) {
      proxyRes.rawHeaders[originalHeaders.cacheControl.valueIndex] = replaceHeaders.cacheControl
    } else {
      res.setHeader('Cache-Control', replaceHeaders.cacheControl)
    }
    // 替换last-modified、expires
    if (originalHeaders.lastModified) {
      proxyRes.rawHeaders[originalHeaders.lastModified.valueIndex] = replaceHeaders.lastModified
    } else {
      res.setHeader('Last-Modified', replaceHeaders.lastModified)
    }
    // 替换expires
    if (originalHeaders.expires) {
      proxyRes.rawHeaders[originalHeaders.expires.valueIndex] = replaceHeaders.expires
    } else {
      res.setHeader('Expires', replaceHeaders.expires)
    }

    // 如果有etag，则缓存etag的最近更新时间
    if (originalHeaders.etag && originalHeaders.etag.value) {
      const cacheKey = cacheReq.generateCacheKey(url, rOptions, interceptOpt, log)
      cacheReq.setEtagLastModifiedTimeCache(cacheKey, originalHeaders.etag.value, now.getTime())
    }

    res.setHeader('Dev-Sidecar-Cache-Response-Interceptor', 'success,' + maxAge)

    // 原值
    const originalCacheControl = originalHeaders.cacheControl ? originalHeaders.cacheControl.value : null
    const originalLastModified = originalHeaders.lastModified ? originalHeaders.lastModified.value : null
    const originalExpires = originalHeaders.expires ? originalHeaders.expires.value : null
    // 替换值
    const cacheControl = replaceHeaders.cacheControl
    const lastModified = replaceHeaders.lastModified
    const expires = replaceHeaders.expires

    // 打印日志
    log.info('cache response intercept: set response head {' +
      ' Cache-Control: ' + (originalCacheControl ? `'${originalCacheControl}' -> ` : '') + `'${cacheControl}',` +
      ' Last-Modified: ' + (originalLastModified ? `'${originalLastModified}' -> ` : '') + `'${lastModified}',` +
      ' Expires: ' + (originalExpires ? `'${originalExpires}' -> ` : '') + `'${expires}' ` +
      `}, url: ${url}`)
  },
  is (interceptOpt) {
    const maxAge = cacheReq.getMaxAge(interceptOpt)
    return maxAge != null && maxAge > 0
  }
}
