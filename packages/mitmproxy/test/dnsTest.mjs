import assert from 'node:assert'
import dns from '../src/lib/dns/index.js'

const presetIp = '100.100.100.100'

const dnsProviders = dns.initDNS({
  ipaddress: {
    type: 'ipaddress',
    server: 'ipaddress',
    cacheSize: 1000,
  },

  // https
  aliyun: {
    type: 'https',
    server: 'https://dns.alidns.com/dns-query',
    cacheSize: 1000,
  },
  cloudflare: {
    type: 'https',
    server: 'https://1.1.1.1/dns-query',
    cacheSize: 1000,
  },
  quad9: {
    type: 'https',
    server: 'https://9.9.9.9/dns-query',
    cacheSize: 1000,
  },
  rubyfish: {
    type: 'https',
    server: 'https://rubyfish.cn/dns-query',
    cacheSize: 1000,
  },
  py233: {
    type: 'https',
    server: ' https://i.233py.com/dns-query',
    cacheSize: 1000,
  },

  // tls
  cloudflareTLS: {
    type: 'tls',
    server: '1.1.1.1',
    servername: 'cloudflare-dns.com',
    cacheSize: 1000,
  },
  quad9TLS: {
    type: 'tls',
    server: '9.9.9.9',
    servername: 'dns.quad9.net',
    cacheSize: 1000,
  },

  // tcp
  googleTCP: {
    type: 'tcp',
    server: '8.8.8.8',
    cacheSize: 1000,
  },
  aliyunTCP: {
    type: 'tcp',
    server: '223.5.5.5',
    cacheSize: 1000,
  },

  // udp
  googleUDP: {
    type: 'udp',
    server: '8.8.8.8',
    cacheSize: 1000,
  },
  aliyunUDP: {
    type: 'udp',
    server: '223.5.5.5',
    cacheSize: 1000,
  },
}, {
  origin: {
    'xxx.com': [
      presetIp
    ]
  }
})

// const test = '111<tr><th>IP Address</th><td><ul class="comma-separated"><li>140.82.113.4</li></ul></td></tr>2222'
// // <tr><th>IP Address</th><td><ul class="comma-separated"><li>140.82.113.4</li></ul></td></tr>
// // <tr><th>IP Address</th><td><ul class="comma-separated"><li>(.*)</li></ul></td></tr>
// const regexp = /<tr><th>IP Address<\/th><td><ul class="comma-separated"><li>(.*)<\/li><\/ul><\/td><\/tr>/
// const matched = regexp.exec(test)
// console.log('data:', matched)

const presetHostname = 'xxx.com'
const hostname1 = 'github.com'
const hostname2 = 'api.github.com'
const hostname3 = 'hk.docmirror.cn'
const hostname4 = 'github.docmirror.cn'
const hostname5 = 'gh.docmirror.top'
const hostname6 = 'gh2.docmirror.top'

let ip

// console.log('----- test ipaddress -----')
// ip = await dnsProviders.ipaddress.lookup(hostname1)
// console.log('===> test ipaddress:', ip, '\n\n')


console.log('----- test https -----')
ip = await dnsProviders.aliyun.lookup(presetHostname)
assert.strictEqual(ip, presetIp) // test preset
console.log('\n\n')
ip = await dnsProviders.aliyun.lookup(hostname1)
console.log('===> test aliyun:', ip, '\n\n')
ip = await dnsProviders.cloudflare.lookup(hostname1)
console.log('===> test cloudflare:', ip, '\n\n')
ip = await dnsProviders.quad9.lookup(hostname1)
console.log('===> test quad9:', ip, '\n\n')
ip = await dnsProviders.rubyfish.lookup(hostname1)
console.log('===> test rubyfish:', ip, '\n\n')
ip = await dnsProviders.py233.lookup(hostname1)
console.log('===> test py233:', ip, '\n\n')


console.log('----- test TLS -----')
ip = await dnsProviders.cloudflareTLS.lookup(presetHostname)
assert.strictEqual(ip, presetIp) // test preset
ip = await dnsProviders.cloudflareTLS.lookup(hostname1)
console.log('===> test cloudflareTLS:', ip, '\n\n')
ip = await dnsProviders.quad9TLS.lookup(hostname1)
console.log('===> test quad9TLS:', ip, '\n\n')


console.log('----- test TCP -----')
ip = await dnsProviders.googleTCP.lookup(presetHostname)
assert.strictEqual(ip, presetIp) // test preset
ip = await dnsProviders.googleTCP.lookup(hostname3)
console.log('===> test googleTCP:', ip, '\n\n')
ip = await dnsProviders.aliyunTCP.lookup(hostname4)
console.log('===> test aliyunTCP:', ip, '\n\n')


console.log('----- test UDP -----')
ip = await dnsProviders.googleUDP.lookup(presetHostname)
assert.strictEqual(ip, presetIp) // test preset
ip = await dnsProviders.googleUDP.lookup(hostname1)
console.log('===> test googleUDP:', ip, '\n\n')
ip = await dnsProviders.aliyunUDP.lookup(hostname2)
console.log('===> test aliyunUDP:', ip, '\n\n')
