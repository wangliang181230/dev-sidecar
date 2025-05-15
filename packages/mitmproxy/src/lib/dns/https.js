const { promisify } = require('node:util')
const doh = require('dns-over-http')
const BaseDNS = require('./base')
const url = require('node:url')
const HttpsAgent = require('../proxy/common/ProxyHttpsAgent')

const dohQueryAsync = promisify(doh.query)

module.exports = class DNSOverHTTPS extends BaseDNS {
  constructor (dnsName, cacheSize, preSetIpList, dnsServer, dnsServerName) {
    super(dnsName, 'HTTPS', cacheSize, preSetIpList)
    this.dnsServer = dnsServer
    this.dnsServerName = dnsServerName
  }

  _dnsQueryPromise (hostname, type = 'A') {
    const options = {
      url: this.dnsServer,
    }
    const questions = [
      {
        type,
        name: hostname,
      },
    ]
    // const cb = null

    // 设置SNI
    if (this.dnsServerName) {
      // 解析URL
      {
        // eslint-disable-next-line node/no-deprecated-api
        const URL = url.parse(options.url)
        // delete options.url
        // options.protocol = URL.protocol
        // options.hostname = URL.host
        // options.host = URL.host
        options.headers = {
          Host: URL.host,
        }
        // options.path = URL.path
        if (URL.port == null) {
          options.port = options.protocol === 'https:' ? 443 : 80
        }
      }

      // 设置SNI
      options.servername = this.dnsServerName
      // options.rejectUnauthorized = false
      options.agent = new HttpsAgent({
        keepAlive: true,
        timeout: 20000,
        rejectUnauthorized: false,
      })
    }

    return dohQueryAsync(options, questions)
  }
}
