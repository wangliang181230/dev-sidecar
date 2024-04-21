const { promisify } = require('util')
const doh = require('dns-over-http')
const BaseDNS = require('./base')
const log = require('../../utils/util.log')
const dohQueryAsync = promisify(doh.query)

module.exports = class DNSOverHTTPS extends BaseDNS {
  constructor (dnsServer) {
    super()
    this.dnsServer = dnsServer
  }

  async _lookup (hostname) {
    try {
      const result = await dohQueryAsync({ url: this.dnsServer }, [{ type: 'A', name: hostname }])
      if (result.answers.length === 0) {
        // 说明没有获取到ip
        log.info('该域名没有ip地址解析:', hostname)
        return []
      }
      const ret = result.answers.filter(item => { return item.type === 'A' }).map(item => { return item.data })
      if (ret.length === 0) {
        log.info('该域名没有IPv4地址解析:', hostname)
      } else {
        log.info('获取到域名地址：', hostname, JSON.stringify(ret))
      }
      return ret
    } catch (e) {
      log.warn('DNS query error:', hostname, ', dns:', this.dnsServer, ', error:', e)
      return []
    }
  }
}
