const LRU = require('lru-cache')
// const { isIP } = require('validator')
const log = require('../../utils/util.log')
const { DynamicChoice } = require('../choice/index')
const cacheSize = 1024
// eslint-disable-next-line no-unused-vars
// function _isIP (v) {
//   return v && isIP(v)
// }

module.exports = class BaseDNS {
  constructor () {
    this.cache = new LRU(cacheSize)
  }

  count (hostname, ip, isError = true) {
    const ipCache = this.cache.get(hostname)
    if (ipCache) {
      ipCache.doCount(ip, isError)
    }
  }

  async lookup (hostname) {
    try {
      // 获取缓存
      let ipCache = this.cache.get(hostname)
      if (!ipCache) {
        // 如果缓存不存在，则创建一个新的缓存
        ipCache = new DynamicChoice(hostname)
        this.cache.set(hostname, ipCache)
      } else if (ipCache.value != null) {
        // 如果缓存存在，且value有值，则直接返回value值
        return ipCache.value
      }

      const start = new Date()
      let ipList = await this._lookup(hostname) // 调用子类的实现方法
      if (ipList == null) {
        // 没有获取到ipv4地址
        ipList = []
      }
      ipList.push(hostname) // 把原域名加入到统计里去

      ipCache.setBackupList(ipList)

      const cost = new Date() - start
      log.info(`[DNS]: ${hostname} ➜ ${ipCache.value} (${cost} ms), ipList: ${JSON.stringify(ipList)}, ipCache:`, JSON.stringify(ipCache))

      return ipCache.value
    } catch (error) {
      log.error(`[DNS] cannot resolve hostname: ${hostname}, error:`, error)
      return hostname
    }
  }
}
