function getTomorrow () {
  const now = new Date()
  const tomorrow = new Date(now)

  // 设置日期为明天
  tomorrow.setDate(now.getDate() + 1)
  // 重置时间为凌晨 0 点 0 分 0 秒
  tomorrow.setHours(0, 0, 0, 0)

  return tomorrow.getTime()
}

const AipOcrClient = require('baidu-aip-sdk').ocr
const AipOcrClientMap = {}
const limitMap = {}

function createBaiduOcrClient (config) {
  const key = config.id + config.ak + config.sk
  if (AipOcrClientMap[key]) {
    return AipOcrClientMap[key]
  }
  const client = new AipOcrClient(config.id, config.ak, config.sk)
  AipOcrClientMap[key] = client
  return client
}

let count = 0

function getConfig (interceptOpt, tryCount, log) {
  tryCount = tryCount || 1

  if (typeof (interceptOpt.baiduOcr) && interceptOpt.baiduOcr.length > 0) {
    const config = interceptOpt.baiduOcr[count++ % interceptOpt.baiduOcr.length]

    if (tryCount < interceptOpt.baiduOcr.length) {
      if (!config.id || !config.ak || !config.sk) {
        return getConfig(interceptOpt, tryCount + 1, log) // 递归找到有效的配置
      }
    }

    // 避免count值过大，造成问题
    if (count >= 100000) count = 0

    if (config) {
      if (config.enable === false) {
        // 尝试解析配置里的limit
        let limit
        try {
          limit = new Date(config.limit)
        } catch (e) {
          try {
            limit = Number.parseInt(config.limit)
          } catch (e) {
          }
        }

        if (limit && limit <= Date.now()) {
          // do nothing：禁用时间已过，继续使用当前账号
        } else {
          log.warn('当前百度云账号，配置里明确禁用它，直接跳过它：', config)
          return getConfig(interceptOpt, tryCount + 1, log) // 递归找到有效的配置
        }
      }

      const key = config.id + config.ak + config.sk
      const limit = limitMap[key]
      if (limit) {
        if (limit <= Date.now()) {
          delete limitMap[key]
          log.warn('当前百度云账号，禁用时间已经隔天了，现在解禁：', config)
          return config
        } else {
          log.warn('当前百度云账号，已经禁用，跳过它：', config)
          return getConfig(interceptOpt, tryCount + 1, log) // 递归找到有效的配置
        }
      }
    }

    return config
  } else {
    return interceptOpt.baiduOcr
  }
}

function disableConfig (config) {
  const key = config.id + config.ak + config.sk
  limitMap[key] = getTomorrow()
  // limitMap[key] = Date.now() + 5000 // 测试用，5秒后解禁
}

module.exports = {
  name: 'baiduOcr',
  priority: 131,
  requestIntercept (context, interceptOpt, req, res, ssl, next, matched) {
    const { rOptions, log } = context

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }

    // 获取图片的base64编码
    let imageBase64 = rOptions.path.substring(rOptions.path.indexOf('?') + 1)
    if (!imageBase64) {
      res.writeHead(400, headers)
      res.write('{"error_code": 999, "error_msg": "图片Base64参数为空"}')
      res.end()
      return true
    }
    imageBase64 = decodeURIComponent(imageBase64)

    const config = getConfig(interceptOpt, null, log)
    if (!config.id || !config.ak || !config.sk) {
      res.writeHead(500, headers)
      res.write('{"error_code": 999, "error_msg": "dev-sidecar中，baiduOcr的 id 或 ak 或 sk 配置为空"}')
      res.end()
      return true
    }

    // 调用通用文字识别（高精度版）（异步）
    const client = createBaiduOcrClient(config)
    const options = {
      detect_direction: 'false',
      paragraph: 'false',
      probability: 'false',
      ...(config.options || {})
    }
    log.info('发起百度ocr请求', req.hostname)
    client.accurateBasic(imageBase64, options).then(function (result) {
      if (result.error_code != null) {
        log.error('baiduOcr error:', result)
        if (result.error_code === 17) {
          // 当前百度云账号，达到当日调用次数上限
          disableConfig(config)
          log.error('当前百度云账号，达到当日调用次数上限，暂时禁用它，明天会自动放开:', config)
        }
      } else {
        log.info('baiduOcr success:', result)
      }

      headers['DS-Interceptor'] = `baiduOcr: id=${config.id},ak=${config.ak},sk=${config.sk}`
      res.writeHead(200, headers)
      res.write(JSON.stringify(result)) // 格式如：{"words_result":[{"words":"6525"}],"words_result_num":1,"log_id":1818877093747960000}
      res.end()
      if (next) next() // 异步执行完继续next
    }).catch(function (err) {
      log.info('baiduOcr error:', err)
      res.writeHead(500, headers)
      res.write('{"error_code": 999, "error_msg": "' + err + '"}') // 格式如：{"words_result":[{"words":"6525"}],"words_result_num":1,"log_id":1818877093747960000}
      res.end()
      if (next) next() // 异步执行完继续next
    })

    log.info('proxy baiduOcr: hostname:', req.hostname)

    return 'no-next'
  },
  is (interceptOpt) {
    return !!interceptOpt.baiduOcr
  }
}
