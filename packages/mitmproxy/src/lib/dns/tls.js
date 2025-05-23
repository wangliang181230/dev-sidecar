const dot = require('./util/dns-over-tls')
const BaseDNS = require('./base')

const defaultPort = 853

module.exports = class DNSOverTLS extends BaseDNS {
  constructor (dnsName, cacheSize, preSetIpList, dnsServer, dnsServerPort, dnsServerName) {
    super(dnsName, 'TLS', cacheSize, preSetIpList)
    this.dnsServer = dnsServer.replace(/\s+/, '')
    this.dnsServerPort = Number.parseInt(dnsServerPort) || defaultPort
    this.dnsServerName = dnsServerName
  }

  _dnsQueryPromise (hostname, type = 'A') {
    const options = {
      host: this.dnsServer,
      port: this.dnsServerPort,
      servername: this.dnsServerName || this.dnsServer,
      rejectUnauthorized: !this.dnsServerName,
      timeout: 4000,
    }

    return dot.query(options, [
      {
        type: 'AAAA',
        name: hostname,
        class: 'IN',
      },
    ])
  }
}
