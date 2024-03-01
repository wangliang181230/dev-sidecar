const lodash = require('lodash')
const log = require('./util.log')

function isMatched (url, regexp) {
  return url.match(regexp)
}

function domainRegexply (target) {
  return '^' + target.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'
}

function domainMapRegexply (hostMap) {
  const regexpMap = {}
  if (hostMap == null) {
    return regexpMap
  }
  lodash.each(hostMap, (value, domain) => {
    if (domain.indexOf('*') >= 0) {
      const regDomain = domainRegexply(domain)
      regexpMap[regDomain] = value
    } else {
      regexpMap[domain] = value
    }
  })
  return regexpMap
}

function matchHostname (hostMap, hostname, action) {
  if (hostMap == null) {
    log.warn(`matchHostname: ${action}: '${hostname}', hostMap is null`)
    return null
  }

  // 域名快速匹配：直接匹配 或者 两种前缀通配符匹配
  let value = hostMap[hostname]
  if (value) {
    log.info(`matchHostname: ${action}: '${hostname}' -> '${hostname}': ${JSON.stringify(value)}`)
    return value // 快速匹配成功
  }
  value = hostMap['*' + hostname]
  if (value) {
    log.info(`matchHostname: ${action}: '${hostname}' -> '*${hostname}': ${JSON.stringify(value)}`)
    return value // 快速匹配成功
  }
  value = hostMap['*.' + hostname]
  if (value) {
    log.info(`matchHostname: ${action}: '${hostname}' -> '*.${hostname}': ${JSON.stringify(value)}`)
    return value // 快速匹配成功
  }

  // 通配符匹配 或 正则表达式匹配
  for (const target in hostMap) {
    if (target.indexOf('*') < 0 && target[0] !== '^') {
      continue // 不是通配符匹配串，也不是正则表达式，跳过
    }

    // 如果是通配符匹配串，转换为正则表达式
    let regexp = target
    if (target[0] !== '^') {
      regexp = domainRegexply(regexp)
    }

    // 正则表达式匹配
    if (hostname.match(regexp)) {
      value = hostMap[target]
      log.info(`matchHostname: ${action}: '${hostname}' -> '${target}': ${JSON.stringify(value)}`)
      return value
    }
  }

  // log.warn(`matchHostname: ${action}: '${hostname}' not matched, map:`, JSON.stringify(hostMap))
}

function merge (oldObj, newObj) {
  return lodash.mergeWith(oldObj, newObj, function (objValue, srcValue) {
    if (lodash.isArray(objValue)) {
      return srcValue
    }
  })
}

function matchHostnameAll (hostMap, hostname, action) {
  if (hostMap == null) {
    log.warn(`matchHostnameAll: ${action}: '${hostname}', hostMap is null`)
    return null
  }

  let values = {}
  let hasValue = false

  // 域名快速匹配：直接匹配 或者 两种前缀通配符匹配
  let value = hostMap[hostname]
  if (value) {
    log.info(`matchHostnameAll: ${action}: '${hostname}' -> '${hostname}': ${JSON.stringify(value)}`)
    values = merge(values, value)
    hasValue = true
  }
  value = hostMap['*' + hostname]
  if (value) {
    log.info(`matchHostnameAll: ${action}: '${hostname}' -> '*${hostname}': ${JSON.stringify(value)}`)
    values = merge(values, value)
    hasValue = true
  }
  value = hostMap['*.' + hostname]
  if (value) {
    log.info(`matchHostnameAll: ${action}: '${hostname}' -> '*.${hostname}': ${JSON.stringify(value)}`)
    values = merge(values, value)
    hasValue = true
  }

  // 通配符匹配 或 正则表达式匹配
  for (const target in hostMap) {
    if (target.indexOf('*') < 0 && target[0] !== '^') {
      continue // 不是通配符匹配串，也不是正则表达式，跳过
    }

    // 如果是通配符匹配串，转换为正则表达式
    let regexp = target
    if (target[0] !== '^') {
      regexp = domainRegexply(regexp)
    }

    // 正则表达式匹配
    if (hostname.match(regexp)) {
      value = hostMap[target]
      // log.info(`matchHostname: ${action}: '${hostname}' -> '${target}': ${JSON.stringify(value)}`)
      values = merge(values, value)
      hasValue = true
    }
  }

  if (hasValue) {
    log.info(`*matchHostnameAll*: ${action}: '${hostname}':`, JSON.stringify(values))
    return values
  } else {
    // log.warn(`matchHostnameAll: ${action}: '${hostname}' not matched, map:`, JSON.stringify(hostMap))
  }
}

module.exports = {
  isMatched,
  domainRegexply,
  domainMapRegexply,
  matchHostname,
  matchHostnameAll
}
