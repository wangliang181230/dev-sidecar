const defaultDns = require('node:dns')
const log = require('../../../utils/util.log.server')
const speedTest = require('../../speed')

function createIpChecker (tester) {
  if (!tester || tester.backupList == null || tester.backupList.length === 0) {
    return null
  }

  return (ip) => {
    for (let i = 0; i < tester.backupList.length; i++) {
      const item = tester.backupList[i]
      if (item.host === ip) {
        if (item.time > 0) {
          return true // IP测速成功
        }
        if (item.status === 'failed') {
          return false // IP测速失败
        }
        break
      }
    }

    return true // IP测速未知
  }
}

module.exports = {
  createLookupFunc (res, dns, action, target, port, isDnsIntercept) {
    target = target ? (`, target: ${target}`) : ''

    return (hostname, options, callback) => {
      const tester = speedTest.getSpeedTester(hostname, port)
      if (tester) {
        const aliveIpObj = tester.pickFastAliveIpObj()
        if (aliveIpObj) {
          const family = aliveIpObj.host.includes(':') ? 6 : 4

          log.info(`----- ${action}: ${hostname}, use alive IPv${family} from dns '${aliveIpObj.dns}': ${aliveIpObj.host}${target} -----`)
          if (res) {
            res.setHeader('DS-DNS-Lookup', `IpTester: ${aliveIpObj.host} ${aliveIpObj.dns === '预设IP' ? 'PreSet' : aliveIpObj.dns}`)
          }
          callback(null, aliveIpObj.host, aliveIpObj.host.includes(':') ? 6 : 4)
          return
        } else {
          log.info(`----- ${action}: ${hostname}, no alive ip${target}, tester: { "ready": ${tester.ready}, "backupList": ${JSON.stringify(tester.backupList)} }`)
        }
      }

      dns.lookup(hostname, null).then((ip) => {
        if (isDnsIntercept) {
          isDnsIntercept.dns = dns
          isDnsIntercept.hostname = hostname
          isDnsIntercept.ip = ip
        }

        if (ip !== hostname) {
          const family = ip.includes(':') ? 6 : 4

          log.info(`----- ${action}: ${hostname}, use IPv${family} from dns '${dns.dnsName}': ${ip}${target} -----`)
          if (res) {
            res.setHeader('DS-DNS-Lookup', `DNS: ${ip} ${dns.dnsName === '预设IP' ? 'PreSet' : dns.dnsName}`)
          }
          callback(null, ip, family)
        } else {
          // 使用默认dns
          log.info(`----- ${action}: ${hostname}, use default DNS: ${hostname}${target}, options:`, options, ', dns:', dns)
          defaultDns.lookup(hostname, options, callback)
        }
      })
    }
  },
}
