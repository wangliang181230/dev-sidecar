const lodash = require('lodash')
function isMatched (url, regexp) {
  return url.match(regexp)
}

function domainRegexply (target) {
  return target.replace(/\./g, '\\.').replace(/\*/g, '.*')
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

function matchHostname (hostMap, hostname) {
  if (hostMap == null) {
    return null
  }

  // 域名快速匹配：直接匹配 或者 两种前缀通配符匹配
  const value = hostMap[hostname] || hostMap['*' + hostname] || hostMap['*.' + hostname]
  if (value) {
    return value // 快速匹配成功
  }

  // 通配符匹配 或 正则表达式匹配
  for (let target in hostMap) {
    if (target.indexOf('*') < 0 && target[0] !== '^') {
      continue // 不是通配符匹配串，也不是正则表达式，跳过
    }

    // 如果是通配符匹配串，转换为正则表达式
    if (target[0] !== '^') {
      target = '^' + domainRegexply(target) + '$'
    }

    // 正则表达式匹配
    if (hostname.match(target)) {
      return hostMap[target]
    }
  }
}
module.exports = {
  isMatched,
  domainRegexply,
  domainMapRegexply,
  matchHostname
}
