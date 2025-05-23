import assert from 'node:assert'
import dns from '../src/lib/dns/index.js'

const dnsProviders = dns.initDNS({
  // tls
  aliyunTLS: {
    server: 'udp://223.5.5.5',
  },
})

let res;

res = await dnsProviders.aliyunTLS._doDnsQuery('rr4---sn-npoldn7z.gvt1.com', 'AAAA')
console.info(res)
console.info('\n\n------\n\n')

res = await dnsProviders.aliyunTLS._doDnsQuery('rr1---sn-4g5lzne6.gvt1.com', 'AAAA')
console.info(res)
console.info('\n\n------\n\n')
