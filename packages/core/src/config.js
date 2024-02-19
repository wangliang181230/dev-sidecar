const fs = require('fs')
const Shell = require('./shell')
const lodash = require('lodash')
const defConfig = require('./config/index.js')
const request = require('request')
const path = require('path')
const log = require('./utils/util.log')
let configTarget = lodash.cloneDeep(defConfig)

const api = require('./api.js')

function get () {
  return configTarget
}

function _deleteDisabledItem (target) {
  lodash.forEach(target, (item, key) => {
    if (item == null) {
      delete target[key]
    }
    if (lodash.isObject(item)) {
      _deleteDisabledItem(item)
    }
  })
}

const getDefaultConfigBasePath = function () {
  return get().server.setting.userBasePath
}

function _getRemoteSavePath () {
  const dir = getDefaultConfigBasePath()
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  return path.join(dir, 'remote_config.json')
}

function _getConfigPath () {
  const dir = getDefaultConfigBasePath()
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  return dir + '/config.json'
}

let timer
const configApi = {
  async startAutoDownloadRemoteConfig () {
    if (timer != null) {
      clearInterval(timer)
    }
    const download = async () => {
      try {
        await configApi.downloadRemoteConfig()
        configApi.reload()
      } catch (e) {
        log.error(e)
      }
    }
    await download()
    timer = setInterval(download, 24 * 60 * 60 * 1000) // 1天
  },
  downloadRemoteConfig () {
    if (get().app.remoteConfig.enabled !== true) {
      return
    }
    const remoteConfigUrl = get().app.remoteConfig.url
    // eslint-disable-next-line handle-callback-err
    return new Promise((resolve, reject) => {
      log.info('开始下载远程配置:', remoteConfigUrl)
      request(remoteConfigUrl, (error, response, body) => {
        if (error) {
          log.error('下载远程配置失败, error:', error, ', response:', response, ', body:', body)
          reject(error)
          return
        }
        if (response && response.statusCode === 200) {
          const remoteSavePath = _getRemoteSavePath()
          fs.writeFileSync(remoteSavePath, body)
          log.info(`下载并保存远程配置成功: ${remoteSavePath}`, body)
          resolve()
        } else {
          log.error('下载远程配置失败, response:', response, ', body:', body)

          let message
          if (response) {
            message = '下载远程配置失败: ' + response.message + ', code: ' + response.statusCode
          } else {
            message = '下载远程配置失败: response: ' + response
          }
          reject(new Error(message))
        }
      })
    })
  },
  readRemoteConfig () {
    if (get().app.remoteConfig.enabled !== true) {
      return {}
    }
    try {
      const path = _getRemoteSavePath()
      if (fs.existsSync(path)) {
        log.info('读取远程配置文件:', path)
        const file = fs.readFileSync(path)
        return JSON.parse(file.toString())
      } else {
        log.warn('远程配置文件不存在:', path)
      }
    } catch (e) {
      log.warn('远程配置读取失败:', e)
    }

    return {}
  },
  /**
   * 保存自定义的 config
   * @param newConfig
   */
  save (newConfig) {
    // 对比默认config的异同
    let saveConfig = configApi.getDefault()
    log.info('saveConfig:', api.toJson(saveConfig))
    if (get().app.remoteConfig.enabled === true) {
      const remoteConfig = configApi.readRemoteConfig()
      log.info('remoteConfig:', api.toJson(remoteConfig))
      saveConfig = api.doMerge(saveConfig, remoteConfig)
      log.info('saveConfig 合并 remoteConfig 后:', api.toJson(saveConfig))
    }
    log.info('newConfig:', api.toJson(newConfig))
    saveConfig = api.doDiff(saveConfig, newConfig)
    const configPath = _getConfigPath()
    const saveConfigJsonStr = api.toJson(saveConfig)
    fs.writeFileSync(configPath, saveConfigJsonStr)
    log.info(`保存 config.json 成功: ${configPath}`, saveConfigJsonStr)
    configApi.reload()
    return saveConfig
  },
  doMerge: api.doMerge,
  doDiff: api.doDiff,
  /**
   * 读取 config.json 后，合并配置
   * @returns {*}
   */
  reload () {
    const configPath = _getConfigPath()
    let userConfig
    if (fs.existsSync(configPath)) {
      const file = fs.readFileSync(configPath)
      userConfig = JSON.parse(file.toString())
    } else {
      userConfig = {}
    }

    const config = configApi.set(userConfig)
    return config || {}
  },
  update (partConfig) {
    const newConfig = lodash.merge(configApi.get(), partConfig)
    configApi.save(newConfig)
  },
  get,
  set (newConfig) {
    if (newConfig == null) {
      newConfig = {}
    }
    const merged = lodash.cloneDeep(newConfig)
    const clone = lodash.cloneDeep(defConfig)
    const remoteConfig = configApi.readRemoteConfig()

    api.doMerge(merged, clone)
    api.doMerge(merged, remoteConfig)
    api.doMerge(merged, newConfig)
    _deleteDisabledItem(merged)
    configTarget = merged
    log.info('加载及合并远程配置完成')
    return configTarget
  },
  getDefault () {
    return lodash.cloneDeep(defConfig)
  },
  addDefault (key, defValue) {
    lodash.set(defConfig, key, defValue)
  },
  resetDefault (key) {
    if (key) {
      let value = lodash.get(defConfig, key)
      value = lodash.cloneDeep(value)
      lodash.set(configTarget, key, value)
    } else {
      configTarget = lodash.cloneDeep(defConfig)
    }
    return configTarget
  },
  async getVariables (type) {
    const method = type === 'npm' ? Shell.getNpmEnv : Shell.getSystemEnv
    const currentMap = await method()
    const list = []
    const map = configTarget.variables[type]
    for (const key in map) {
      const exists = currentMap[key] != null
      list.push({
        key,
        value: map[key],
        exists
      })
    }
    return list
  },
  async setVariables (type) {
    const list = await configApi.getVariables(type)
    const noSetList = list.filter(item => {
      return !item.exists
    })
    if (list.length > 0) {
      const context = {
        root_ca_cert_path: configApi.get().server.setting.rootCaFile.certPath
      }
      for (const item of noSetList) {
        if (item.value.indexOf('${') >= 0) {
          for (const key in context) {
            item.value = item.value.replcace(new RegExp('${' + key + '}', 'g'), context[key])
          }
        }
      }
      const method = type === 'npm' ? Shell.setNpmEnv : Shell.setSystemEnv
      return method({ list: noSetList })
    }
  }
}

module.exports = configApi
