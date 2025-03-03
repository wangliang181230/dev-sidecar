const dnstls = require('dns-over-tls')
const BaseDNS = require('./base')

const defaultPort = 853

module.exports = class DNSOverTLS extends BaseDNS {
  constructor (dnsName, cacheSize, preSetIpList, dnsServer, dnsServerPort, dnsServerName) {
    super(dnsName, cacheSize, preSetIpList)
    this.dnsServer = dnsServer
    this.dnsServerPort = Number.parseInt(dnsServerPort) || defaultPort
    this.dnsServerName = dnsServerName
  }

  async _doDnsQuery (hostname) {
    const options = {
      host: this.dnsServer,
      servername: this.dnsServerName,
      name: hostname,
      klass: 'IN',
      type: 'A',
      port: this.dnsServerPort,
    }

    return await dnstls.query(options)
  }
}
