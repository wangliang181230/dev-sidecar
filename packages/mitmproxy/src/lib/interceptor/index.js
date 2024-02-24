const custom = require('./impl/custom')

const success = require('./impl/success')
const redirect = require('./impl/redirect')
const abort = require('./impl/abort')

const proxy = require('./impl/proxy')
const sni = require('./impl/sni')

const script = require('./impl/script')

const modules = [
  custom,
  success, redirect, abort,
  proxy, sni,
  script
]

module.exports = modules
