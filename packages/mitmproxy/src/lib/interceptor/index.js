// request interceptor impls
const cacheReq = require('./impl/req/cacheReq')

const success = require('./impl/req/success')
const redirect = require('./impl/req/redirect')
const abort = require('./impl/req/abort')

const proxy = require('./impl/req/proxy')
const sni = require('./impl/req/sni')

// response interceptor impls
const cacheRes = require('./impl/res/cacheRes')
const script = require('./impl/res/script')

const modules = [
  // request interceptor impls
  cacheReq,
  success, redirect, abort,
  proxy, sni,

  // response interceptor impls
  cacheRes, script
]

module.exports = modules
