const SpeedTester = require('./SpeedTester.js')
const lodash = require('lodash')
const config = require('./config')
const log = require('../../utils/util.log.js')

const SPEED_TEST_POOL = {}

function initSpeedTest (runtimeConfig) {
  const { enabled, hostnameList } = runtimeConfig
  const conf = config.getConfig()
  lodash.merge(conf, runtimeConfig)
  if (!enabled) {
    return
  }
  lodash.forEach(hostnameList, (hostname) => {
    SPEED_TEST_POOL[hostname] = new SpeedTester({ hostname })
  })
  log.info('[speed] enabled')
}

function getAllSpeedTester () {
  const allSpeed = {}
  if (!config.getConfig().enabled) {
    return allSpeed
  }
  lodash.forEach(SPEED_TEST_POOL, (item, key) => {
    allSpeed[key] = {
      hostname: key,
      alive: item.alive,
      backupList: item.backupList
    }
  })
  return allSpeed
}

function getSpeedTester (hostname, autoCreate = true) {
  if (!config.getConfig().enabled) {
    return null
  }
  let instance = SPEED_TEST_POOL[hostname]
  if (instance == null && autoCreate) {
    instance = new SpeedTester({ hostname })
    SPEED_TEST_POOL[hostname] = instance
  }
  return instance
}

// function registerNotify (notify) {
//   config.notify = notify
// }

function reSpeedTest () {
  lodash.forEach(SPEED_TEST_POOL, (item, key) => {
    item.test()
  })
}

// action调用
function action (event) {
  if (event.key === 'reTest') {
    reSpeedTest()
  } else if (event.key === 'getList') {
    process.send({ type: 'speed', event: { key: 'getList', value: getAllSpeedTester() } })
  }
}
module.exports = {
  // SpeedTester,
  initSpeedTest,
  getSpeedTester,
  // getAllSpeedTester,
  // registerNotify,
  // reSpeedTest,
  action
}
