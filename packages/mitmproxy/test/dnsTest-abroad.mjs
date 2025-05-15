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
  cloudflareDoH: {
    server: 'https://1.1.1.1:443/dns-query',
    sni: 'baidu.com',
  },
  quad9DoH: {
    server: 'https://9.9.9.9:443/dns-query',
    sni: 'baidu.com',
    forSNI: true,
  },
  rubyfishDoH: {
    server: 'https://rubyfish.cn:443/dns-query',
    sni: 'baidu.com',
  },
  py233DoH: {
    server: ' https://i.233py.com:443/dns-query',
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


const hasPresetHostname = 'xxx.com'
const noPresetHostname = 'yyy.com'

const hostname1 = 'github.com'
const hostname2 = 'api.github.com'
const hostname3 = 'hk.docmirror.cn'
const hostname4 = 'github.docmirror.cn'
const hostname5 = 'gh.docmirror.top'
const hostname6 = 'gh2.docmirror.top'

let ip


// console.log('\n--------------- test ForSNI ---------------\n')
// console.log(`===> test ForSNI: ${dnsProviders.ForSNI.dnsName}`, '\n\n')
// assert.strictEqual(dnsProviders.ForSNI, dnsProviders.quad9DoH)
//
//
// console.log('\n--------------- test PreSet ---------------\n')
// ip = await dnsProviders.PreSet.lookup(hasPresetHostname)
// console.log(`===> test PreSet: ${hasPresetHostname} ->`, ip, '\n\n')
// console.log('\n\n')
// assert.strictEqual(ip, presetIp) // 预设过IP，等于预设的IP
//
// ip = await dnsProviders.PreSet.lookup(noPresetHostname)
// console.log(`===> test PreSet: ${noPresetHostname} ->`, ip, '\n\n')
// console.log('\n\n')
// assert.strictEqual(ip, noPresetHostname) // 未预设IP，等于域名自己
//
//
// console.log('\n--------------- test udp ---------------\n')
// ip = await dnsProviders.cloudflareUdp.lookup(hasPresetHostname)
// assert.strictEqual(ip, presetIp) // test preset
// console.log('\n\n')
//
// assert.strictEqual(dnsProviders.cloudflareUdp.dnsType, 'UDP')
// ip = await dnsProviders.cloudflareUdp.lookup(hostname1)
// console.log(`===> test cloudflareUdp: ${hostname1} ->`, ip, '\n\n')
//
// assert.strictEqual(dnsProviders.quad9Udp.dnsType, 'UDP')
// ip = await dnsProviders.quad9Udp.lookup(hostname1)
// console.log(`===> test quad9Udp: ${hostname1} ->`, ip, '\n\n')
//
//
// console.log('\n--------------- test tcp ---------------\n')
// ip = await dnsProviders.cloudflareTcp.lookup(hasPresetHostname)
// assert.strictEqual(ip, presetIp) // test preset
// console.log('\n\n')
//
// assert.strictEqual(dnsProviders.cloudflareTcp.dnsType, 'TCP')
// ip = await dnsProviders.cloudflareTcp.lookup(hostname1)
// console.log(`===> test cloudflareTcp: ${hostname1} ->`, ip, '\n\n')
//
// assert.strictEqual(dnsProviders.quad9Tcp.dnsType, 'TCP')
// ip = await dnsProviders.quad9Tcp.lookup(hostname1)
// console.log(`===> test quad9Tcp: ${hostname1} ->`, ip, '\n\n')


console.log('\n--------------- test DoH ---------------\n')
ip = await dnsProviders.cloudflareDoH.lookup(hasPresetHostname)
assert.strictEqual(ip, presetIp) // test preset
console.log('\n\n')

assert.strictEqual(dnsProviders.cloudflareDoH.dnsType, 'HTTPS')
ip = await dnsProviders.cloudflareDoH.lookup(hostname1)
console.log(`===> test cloudflareDoH: ${hostname1} ->`, ip, '\n\n')

assert.strictEqual(dnsProviders.quad9DoH.dnsType, 'HTTPS')
ip = await dnsProviders.quad9DoH.lookup(hostname1)
console.log(`===> test quad9DoH: ${hostname1} ->`, ip, '\n\n')

assert.strictEqual(dnsProviders.rubyfishDoH.dnsType, 'HTTPS')
ip = await dnsProviders.rubyfishDoH.lookup(hostname1)
console.log(`===> test rubyfishDoH: ${hostname1} ->`, ip, '\n\n')

assert.strictEqual(dnsProviders.py233DoH.dnsType, 'HTTPS')
ip = await dnsProviders.py233DoH.lookup(hostname1)
console.log(`===> test py233DoH: ${hostname1} ->`, ip, '\n\n')


// console.log('\n--------------- test DoT ---------------\n')
// ip = await dnsProviders.cloudflareDoT.lookup(hasPresetHostname)
// assert.strictEqual(ip, presetIp) // test preset
// console.log('\n\n')
//
// assert.strictEqual(dnsProviders.cloudflareDoT.dnsType, 'TLS')
// ip = await dnsProviders.cloudflareDoT.lookup(hostname1)
// console.log(`===> test cloudflareDoT: ${hostname1} ->`, ip, '\n\n')
//
// assert.strictEqual(dnsProviders.quad9DoT.dnsType, 'TLS')
// ip = await dnsProviders.quad9DoT.lookup(hostname1)
// console.log(`===> test quad9DoT: ${hostname1} ->`, ip, '\n\n')
