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
    this.countMap = {} /* ip -> count { value, total, success, keepErrorCount, successRate, time, resetCount } */
    this.value = null // 当前使用的host
    this.backupList = [] // 备选host列表
    this.changeCount = 0 // 切换次数
    this.changeTime = null
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

    const newBackupList = countList.map(item => item.value)
    this.setBackupList(newBackupList)
  }

  newCount (ip) {
    return { key: this.key === ip ? null : this.key, value: ip, total: 0, success: 0, keepErrorCount: 0, successRate: 1, time: new Date(), resetCount: 0 }
  }

  /**
   * 设置新的backup列表
   * @param newBackupList 新的backupList
   * @param doMerge 是否合并到原有的backupList中
   */
  setBackupList (newBackupList, doMerge = true) {
    // 从backupList中删除当前使用的ip
    if (this.value != null) {
      newBackupList = newBackupList.filter(ip => ip !== this.value)
    }

    // 设置新的backupList
    if (doMerge) {
      this.backupList = [...new Set([...this.backupList, ...newBackupList])]
    } else {
      this.backupList = newBackupList
    }

    // 将新的backupList中的ip加入到countMap中
    for (const ip of this.backupList) {
      if (!this.countMap[ip]) {
        this.countMap[ip] = this.newCount(ip)
      }
    }

    // 如果当前未使用任何ip，切换到backupList中的第一个
    if (this.value == null && this.backupList.length > 0) {
      // 我自己使用的规则：特殊处理github.com，优先使用直连
      if (this.key === 'github.com') {
        for (let i = 0; i < this.backupList.length; i++) {
          if (this.backupList[i] === 'github.com') {
            this.value = this.backupList[i]
            this.backupList.splice(i, 1)
            break
          }
        }
      }

      // 为空时，直接使用第一个
      if (this.value == null) {
        this.value = this.backupList.shift()
      }
      log.info(`选用backup完成：${this.key} ➜ ${this.value}, backup:`, this.backupList)
      this.changeCount++
      this.changeTime = new Date()
    }
  }

  // countStart (value) {
  //   this.doCount(value, false)
  // }

  /**
   * 换下一个
   * @param count 计数器
   * @param reason 切换原因
   */
  changeNext (count, reason) {
    log.info(`切换backup: ${this.key}, reason: ${reason}, backupList: ${JSON.stringify(this.backupList)}, count:`, count)

    // 初始化 `count` 的各计量数据
    count.keepErrorCount = 0
    count.total = 0
    count.success = 0
    count.successRate = 1
    count.time = new Date()
    count.resetCount++

    const valueBackup = this.value
    this.changeCount++
    this.changeTime = new Date()
    if (this.backupList.length > 0) {
      this.value = this.backupList.shift()
      log.info(`切换backup完成: ${this.key}, ip: ${valueBackup} ➜ ${this.value}, this:`, this)
    } else {
      this.value = null
      log.info(`切换backup完成: ${this.key}, backupList为空了，设置this.value: from '${valueBackup}' to null. this:`, this)
    }
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

    // 记录使用次数
    count.total++
    if (isError) {
      // 失败了，累计连续失败次数
      count.keepErrorCount++
    } else {
      // 成功了，记录成功次数，并清空连续失败次数
      count.success++
      count.keepErrorCount = 0
    }
    // 计算成功率
    count.successRate = parseFloat((count.success / count.total).toFixed(2)) // 保留两位小数

    // 如果出错了，且当前使用的就是这个地址，才校验切换策略
    if (isError && this.value === count.value) {
      let changeReason
      if (count.keepErrorCount === 1 && count.total === 1) {
        changeReason = '首次访问就失败了' // 我觉得首次访问就失败的域名，应该不是很好的域名，所以这里直接切换掉
      } else if (count.keepErrorCount >= 3) {
        changeReason = `连续错误 ${count.keepErrorCount} 次`
      } else if (count.keepErrorCount >= 2 && count.successRate < 0.25) {
        changeReason = `连续错误 ${count.keepErrorCount} 次，且成功率 ${count.successRate} < 0.25`
      } else if (count.total >= 3 && count.successRate < 0.4) {
        changeReason = `成功率 ${count.successRate} < 0.4`
      }

      if (changeReason) {
        this.changeNext(count, changeReason)
      }
    }
  }
}

module.exports = {
  DynamicChoice,
  ChoiceCache
}
