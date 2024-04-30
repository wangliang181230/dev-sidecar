const DNSOverTLS = require('./tls.js')
const DNSOverHTTPS = require('./https.js')
const DNSOverIpAddress = require('./ipaddress.js')
const matchUtil = require('../../utils/util.match')

module.exports = {
  initDNS (dnsProviders) {
    const dnsMap = {}
    for (const provider in dnsProviders) {
      const conf = dnsProviders[provider]
      switch (conf.type) {
        case 'https':
          dnsMap[provider] = new DNSOverHTTPS(conf.server)
          break
        case 'ipaddress':
          dnsMap[provider] = new DNSOverIpAddress(conf.server)
          break
        case 'tlk':
        default:
          dnsMap[provider] = new DNSOverTLS(conf.server)
          break
      }
    }
    return dnsMap
  },
  hasDnsLookup (dnsConfig, hostname) {
    const providerName = matchUtil.matchHostname(dnsConfig.mapping, hostname, 'get dns providerName')
    if (providerName) {
      return dnsConfig.providers[providerName]
    }
  }
}
