const matchUtil = require('../src/utils/util.match')

let value = matchUtil.matchHostname({
  '*openai.com': true,
  '*chatgpt.com': true
}, 'chat.openai.com', 'test1')
console.log(value)

value = matchUtil.matchHostname({
  '^.*openai\\.com$': true,
  '^.*chatgpt\\.com$': true
}, 'chat.openai.com', 'test2')
console.log(value)
