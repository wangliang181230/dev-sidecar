const matchUtil = require('../../utils/util.match')
const DNSOverPreSetIpList = require('./preset.js')
const DNSOverIpAddress = require('./ipaddress.js')
const DNSOverHTTPS = require('./https.js')
const DNSOverTLS = require('./tls.js')
const DNSOverTCP = require('./tcp.js')
const DNSOverUDP = require('./udp.js')

module.exports = {
  initDNS (dnsProviders, preSetIpList) {
    const dnsMap = {}

    // 创建普通的DNS
    for (const provider in dnsProviders) {
      const conf = dnsProviders[provider]
      const server = conf.server || conf.host

      if (!server) {
        continue
      }

      // 获取DNS类型
      if (conf.type == null) {
        if (conf.server.startsWith('https://')) {
          conf.type = 'https'
        } else if (conf.server.startsWith('tls://')) {
          conf.type = 'tls'
        } else if (conf.server.startsWith('tcp://')) {
          conf.type = 'tcp'
        } else {
          conf.type = 'udp'
        }
      } else {
        conf.type = conf.type.toLowerCase()
      }

      if (conf.type === 'ipaddress') {
        dnsMap[provider] = new DNSOverIpAddress(provider, conf.cacheSize, preSetIpList)
      } else if (conf.type === 'https') {
        dnsMap[provider] = new DNSOverHTTPS(provider, conf.cacheSize, preSetIpList, server)
      } else if (conf.type === 'tls') {
        dnsMap[provider] = new DNSOverTLS(provider, conf.cacheSize, preSetIpList, server, conf.port, conf.servername)
      } else if (conf.type === 'tcp') {
        dnsMap[provider] = new DNSOverTCP(provider, conf.cacheSize, preSetIpList, server, conf.port)
      } else { // udp
        dnsMap[provider] = new DNSOverUDP(provider, conf.cacheSize, preSetIpList, server, conf.port)
      }

      // 设置DNS名称到name属性中
      dnsMap[provider].name = provider
      dnsMap[provider].type = conf.type
    }

    // 创建预设IP的DNS
    dnsMap.PreSet = new DNSOverPreSetIpList(preSetIpList)

    return dnsMap
  },
  hasDnsLookup (dnsConfig, hostname) {
    let providerName = null

    // 先匹配 预设IP配置
    const hostnamePreSetIpList = matchUtil.matchHostname(dnsConfig.preSetIpList, hostname, 'matched preSetIpList')
    if (hostnamePreSetIpList) {
      return dnsConfig.dnsMap.PreSet
    }

    // 再匹配 DNS映射配置
    providerName = matchUtil.matchHostname(dnsConfig.mapping, hostname, 'get dns providerName')

    // 由于DNS中的usa已重命名为cloudflare，所以做以下处理，为了向下兼容
    if (providerName === 'usa' && dnsConfig.dnsMap.usa == null && dnsConfig.dnsMap.cloudflare != null) {
      return dnsConfig.dnsMap.cloudflare
    }

    if (providerName) {
      return dnsConfig.dnsMap[providerName]
    }
  },
}
