const matchUtil = require('../src/utils/util.match')

const hostMap = matchUtil.domainMapRegexply({
  'aaa.com': true,
  '*bbb.com': true,
  '*.ccc.com': true,
  '^.{1,3}ddd.com$': true
})

let value

console.log('test1:')
value = matchUtil.matchHostname(hostMap, 'aaa.com', 'test1.1')
console.log(value) // true
value = matchUtil.matchHostname(hostMap, 'aaaa.com', 'test1.2')
console.log(value) // undefined
value = matchUtil.matchHostname(hostMap, 'aaaa.comx', 'test1.3')
console.log(value) // undefined

console.log('test2:')
value = matchUtil.matchHostname(hostMap, 'bbb.com', 'test2.1')
console.log(value) // true
value = matchUtil.matchHostname(hostMap, 'xbbb.com', 'test2.2')
console.log(value) // true
value = matchUtil.matchHostname(hostMap, 'bbb.comx', 'test2.3')
console.log(value) // undefined
value = matchUtil.matchHostname(hostMap, 'x.bbb.com', 'test2.4')
console.log(value) // true

console.log('test3:')
value = matchUtil.matchHostname(hostMap, 'ccc.com', 'test3.1')
console.log(value) // true
value = matchUtil.matchHostname(hostMap, 'x.ccc.com', 'test3.2')
console.log(value) // true
value = matchUtil.matchHostname(hostMap, 'xccc.com', 'test3.3')
console.log(value) // undefined

console.log('test4:')
value = matchUtil.matchHostname(hostMap, 'ddd.com', 'test4.1')
console.log(value) // undefined
value = matchUtil.matchHostname(hostMap, 'x.ddd.com', 'test4.2')
console.log(value) // true
value = matchUtil.matchHostname(hostMap, 'xddd.com', 'test4.3')
console.log(value) // true
