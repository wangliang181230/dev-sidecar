import assert from 'node:assert'
import dns from '../src/lib/dns/index.js'
import matchUtil from '../src/utils/util.match.js'

const presetIp = '100.100.100.100'
const preSetIpList = matchUtil.domainMapRegexply({
  'xxx.com': [
    presetIp
  ]
})

// 境外DNS测试
const dnsProviders = dns.initDNS({
  // udp
  cloudflareUdp: {
    server: 'udp://1.1.1.1',
  },
  quad9Udp: {
    server: 'udp://9.9.9.9',
  },

  // tcp
  cloudflareTcp: {
    server: 'tcp://1.1.1.1',
  },
  quad9Tcp: {
    server: 'tcp://9.9.9.9',
  },

  // https
  testDoH: {
    server: 'https://doh.opendns.com/dns-query',
    sni: 'baidu.com',
  },

  // tls
  cloudflareDoT: {
    type: 'tls',
    server: '1.1.1.1',
    sni: 'baidu.com',
  },
  quad9DoT: {
    server: 'tls://9.9.9.9',
    sni: 'baidu.com',
  },
}, preSetIpList)


const hostname1 = 'github.com'

let ip



console.log('\n--------------- test DoH ---------------\n')

assert.strictEqual(dnsProviders.testDoH.dnsType, 'HTTPS')
ip = await dnsProviders.testDoH.lookup(hostname1)
console.log(`===> test testDoH '${dnsProviders.testDoH.dnsServer}': ${hostname1} ->`, ip, '\n\n')
