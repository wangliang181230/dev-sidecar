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
  // 星期
  if (interceptOpt.cacheWeeks > 0) {
    return interceptOpt.cacheWeeks * 604800 // 60 * 60 * 3600 * 7
  }
  // 月
  if (interceptOpt.cacheMonths > 0) {
    return interceptOpt.cacheMonths * 2592000 // 60 * 60 * 3600 * 30
  }
  // 年
  if (interceptOpt.cacheYears > 0) {
    return interceptOpt.cacheYears * 31536000 // 60 * 60 * 3600 * 365
  }

  return null
}

// region etag缓存相关

const etagLastModifiedTimeCache = {}

function generateUrl (rOptions) {
  return `${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}${rOptions.url || rOptions.url}`
}

function generateCacheKey (url, rOptions, interceptOpt) {
  let cacheKey = url || generateUrl(rOptions)

  // 除了URL，还要根据缓存键生成策略，组装缓存键
  let generationStrategy = interceptOpt.etagCacheKeyGenerationStrategy
  if (generationStrategy) {
    if (typeof generationStrategy === 'string') {
      generationStrategy = { headers: [generationStrategy] }
    } else if (Array.isArray(generationStrategy)) {
      generationStrategy = { headers: generationStrategy }
    }

    // 头信息拼装策略
    if (generationStrategy.headers && generationStrategy.headers.length > 0) {
      for (let header of generationStrategy.headers) {
        header = header.toLowerCase()
        const value = rOptions.headers[header]
        if (value != null) {
          cacheKey += `|${header}=${value}`
        }
      }
    }
  }

  return cacheKey
}

function setEtagLastModifiedTimeCache (key, etag, lastModifiedTime) {
  const cache = etagLastModifiedTimeCache[key]
  if (cache) {
    cache.etag = etag
    cache.lastModifiedTime = lastModifiedTime
  } else {
    etagLastModifiedTimeCache[key] = { etag, lastModifiedTime }
  }
}

function getEtagLastModifiedTimeCache (key, etag) {
  const cache = etagLastModifiedTimeCache[key]
  if (!cache || cache.etag !== etag) {
    return null
  }

  return cache.lastModifiedTime
}

// endregion

// region 获取 lastModifiedTime 的方法

function getLastModifiedTimeFromIfModifiedSince (rOptions, log) {
  // 获取 If-Modified-Since 和 If-None-Match 用于判断是否命中缓存
  const lastModified = rOptions.headers['if-modified-since']
  if (lastModified == null || lastModified.length === 0) {
    return null // 没有lastModified，返回null
  }

  try {
    // 尝试解析 lastModified，并获取time
    return new Date(lastModified).getTime()
  } catch (e) {
    // 为数字时，直接返回
    if (/\\d+/g.test(lastModified)) {
      return lastModified - 0
    }

    log.warn(`cache intercept: 解析 if-modified-since 失败: '${lastModified}', error:`, e)
  }

  return null
}

function getLastModifiedTimeFromEtagCache (url, rOptions, interceptOpt) {
  const etag = rOptions.headers['if-none-match']
  if (etag != null && etag.length > 0) {
    const cacheKey = generateCacheKey(url, rOptions, interceptOpt)
    const lastModifiedTime = getEtagLastModifiedTimeCache(cacheKey, etag)
    if (lastModifiedTime != null) {
      return lastModifiedTime
    }
  }
}

// endregion

module.exports = {
  name: 'cacheReq',
  priority: 111,
  generateUrl,
  setEtagLastModifiedTimeCache,
  generateCacheKey,
  requestIntercept (context, interceptOpt, req, res, ssl, next) {
    const { rOptions, log } = context

    if (rOptions.method !== 'GET') {
      return
    }

    // // 获取 Cache-Control 用于判断是否禁用缓存
    // const cacheControl = rOptions.headers['cache-control']
    // if (cacheControl && (cacheControl.indexOf('no-cache') >= 0 || cacheControl.indexOf('no-store') >= 0)) {
    //   return // 禁用缓存，不拦截
    // }
    // // 获取 Pragma 用于判断是否禁用缓存
    // const pragma = rOptions.headers.pragma
    // if (pragma && (pragma.indexOf('no-cache') >= 0 || pragma.indexOf('no-store') >= 0)) {
    //   return // 禁用缓存，不拦截
    // }

    const url = generateUrl(rOptions)

    // 最近编辑时间
    let lastModifiedTimeFrom = ''
    // 先从 if-modified-since 中获取最近编辑时间
    let lastModifiedTime = getLastModifiedTimeFromIfModifiedSince(rOptions, log)
    if (lastModifiedTime == null) {
      // 从 etag缓存 中获取最近编辑时间
      lastModifiedTime = getLastModifiedTimeFromEtagCache(url, rOptions, interceptOpt)
      if (lastModifiedTime > 0) {
        lastModifiedTimeFrom = ':etagCache'
      } else {
        return // 没有 lastModified，不拦截
      }
    }

    // 获取maxAge配置
    const maxAge = getMaxAge(interceptOpt)

    // 判断缓存是否过期
    const passTime = Date.now() - lastModifiedTime
    if (passTime > maxAge * 1000) {
      return // 缓存已过期，不拦截
    }

    // 缓存未过期，直接拦截请求并响应304
    res.writeHead(304, {
      'Dev-Sidecar-Interceptor': 'cacheReq' + lastModifiedTimeFrom
    })
    res.end()

    log.info('cache intercept:', url)
    return true
  },
  is (interceptOpt) {
    const maxAge = getMaxAge(interceptOpt)
    return maxAge != null && maxAge > 0
  },
  getMaxAge
}
