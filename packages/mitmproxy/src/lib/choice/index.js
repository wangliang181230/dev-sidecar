const LRU = require('lru-cache')
const cacheSize = 1024
const log = require('../../utils/util.log')
class ChoiceCache {
  constructor () {
    this.cache = new LRU(cacheSize)
  }

  get (key) {
    return this.cache.get(key)
  }

  getOrCreate (key, backupList) {
    log.info('get counter:', key)
    let item = this.cache.get(key)
    if (item == null) {
      item = new DynamicChoice(key)
      item.setBackupList(backupList)
      this.cache.set(key, item)
    }
    return item
  }
}

class DynamicChoice {
  constructor (key) {
    this.key = key
    this.countMap = {} /* ip -> count { value, total, error, keepErrorCount, successRate } */
    this.value = null // 当前使用的host
    this.backupList = [] // 备选host列表
    this.lastChangeTime = new Date()
    this.createTime = new Date()
  }

  doRank () {
    // 将count里面根据成功率排序
    const countList = []
    for (const key in this.countMap) {
      countList.push(this.countMap[key])
    }

    // 将countList根据成功率和总使用次数排序
    countList.sort((a, b) => {
      if (b.successRate === a.successRate) {
        return b.total - a.total
      } else if (b.successRate > a.successRate) {
        if (b.total === 0) {
          return a.total === 0 ? 1 : -1
        } else {
          return 1
        }
      } else {
        return a.total === 0 ? b.total : -1
      }
    })
    log.info('Do rank:', JSON.stringify(countList))
    const backupList = countList.map(item => item.value)

    this.setBackupList(backupList)
  }

  newCount (ip) {
    return { value: ip, total: 0, error: 0, keepErrorCount: 0, successRate: 1 }
  }

  /**
   * 设置新的backup列表
   * @param backupList
   */
  setBackupList (backupList) {
    // 设置新的backupList
    log.info('set backupList:', backupList, ', this.backupList:', this.backupList, 'this.countMap:', this.countMap)
    this.backupList = backupList

    // 将新的backupList中的ip加入到countMap中
    for (const ip of backupList) {
      if (this.countMap[ip]) {
        continue
      }
      this.countMap[ip] = this.newCount(ip)
    }

    // 如果当前未使用任何ip，切换到backupList中的第一个
    if (this.value == null && backupList.length > 0) {
      this.value = backupList.shift()
    }
  }

  countStart (value) {
    this.doCount(value, false)
  }

  /**
   * 换下一个
   * @param count 计数器
   * @param reason 切换原因
   */
  changeNext (count, reason) {
    log.info(`切换backup: ${this.key}, reason: ${reason}, backupList: ${this.backupList}, count:`, count)

    // 初始化 `count` 的各计量数据
    count.keepErrorCount = 0
    count.total = 0
    count.error = 0
    count.successRate = 1

    const valueBackup = this.value
    if (this.backupList.length > 0) {
      this.value = this.backupList.shift()
      log.info(`切换backup完成: ${this.key}, ip: ${valueBackup} ➜ ${this.value}, this:`, this)
    } else {
      this.value = null
      log.info(`切换backup完成: ${this.key}, backupList为空了，设置this.value: from '${valueBackup}' to null. this:`, this)
    }

    this.lastChangeTime = new Date()
  }

  /**
   * 记录使用次数或错误次数
   * @param ip
   * @param isError
   */
  doCount (ip, isError) {
    let count = this.countMap[ip]
    if (count == null) {
      count = this.countMap[ip] = this.newCount(ip)
    }

    count.total++
    if (isError === true) {
      count.error++
      count.keepErrorCount++
    } else {
      count.keepErrorCount = 0 // 成功了，清空连续失败次数
    }

    count.successRate = (1.0 - (count.error / count.total))
      .toFixed(2) // 保留两位小数

    // 如果出错了，且当前使用的就是这个地址，且总计使用3次及以上时，才校验切换策略
    if (isError && this.value === count.value && count.total >= 3) {
      // 连续错误3次，切换下一个
      if (count.keepErrorCount >= 3) {
        this.changeNext(count, `连续错误${count.keepErrorCount}次`)
      }
      // 成功率小于40%,切换下一个
      if (count.successRate < 0.4) {
        this.changeNext(count, `成功率小于 ${count.successRate} < 0.4`)
      }
    }
  }
}

module.exports = {
  DynamicChoice,
  ChoiceCache
}
