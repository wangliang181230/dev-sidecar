module.exports = {
  name: 'cache',
  priority: 21,
  responseIntercept (context, interceptOpt, req, res, proxyReq, proxyRes, ssl, next) {
    const { rOptions, log } = context

    if (rOptions.method === 'GET' && res.statusCode >= 200 && res.statusCode < 300 && interceptOpt.cache >= 0) {
      // Cache-Control
      const cacheControl = interceptOpt.cacheControl || `max-age=${interceptOpt.cache + 1}`
      // lastModified
      const lastModified = new Date().toUTCString()
      // expires
      const expires = new Date(Date.now() + interceptOpt.cache * 1000).toUTCString()

      const isSet = [false, false, false]
      const oldValue = {}
      for (let i = 0; i < proxyRes.rawHeaders.length; i += 2) {
        // 尝试修改rawHeaders中的cache-control、last-modified、expires
        if (proxyRes.rawHeaders[i].toLowerCase() === 'cache-control') {
          oldValue.cacheControl = proxyRes.rawHeaders[i + 1]
          proxyRes.rawHeaders[i + 1] = cacheControl
          isSet[0] = true
        } else if (proxyRes.rawHeaders[i].toLowerCase() === 'last-modified') {
          oldValue.lastModified = proxyRes.rawHeaders[i + 1]
          proxyRes.rawHeaders[i + 1] = lastModified
          isSet[1] = true
        } else if (proxyRes.rawHeaders[i].toLowerCase() === 'expires') {
          oldValue.expires = proxyRes.rawHeaders[i + 1]
          proxyRes.rawHeaders[i + 1] = expires
          isSet[2] = true
        }

        // 如果已经设置了cache-control、last-modified、expires，则直接break
        if (isSet[0] && isSet[1] && isSet[2]) {
          break
        }
      }

      // 如果没有设置，则直接setHeader
      if (!isSet[0]) {
        res.setHeader('Cache-Control', cacheControl)
      }
      if (!isSet[1]) {
        res.setHeader('Last-Modified', lastModified)
      }
      if (!isSet[2]) {
        res.setHeader('Expires', expires)
      }

      res.setHeader('Dev-Sidecar-Cache-Response-Interceptor', interceptOpt.cache)

      const url = `${rOptions.method} ➜ ${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}${req.url}`
      log.info('cache response intercept: set response head {' +
        ' Cache-Control: ' + (oldValue.cacheControl ? `'${oldValue.cacheControl}' -> ` : '') + `'${cacheControl}',` +
        ' Last-Modified: ' + (oldValue.lastModified ? `'${oldValue.lastModified}' -> ` : '') + `'${lastModified}',` +
        ' Expires: ' + (oldValue.expires ? `'${oldValue.expires}' -> ` : '') + `'${expires}' ` +
        `}, url: ${url}`)
    }
  },
  is (interceptOpt) {
    return interceptOpt.cache != null
  }
}
