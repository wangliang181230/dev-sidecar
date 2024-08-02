const AipOcrClient = require('baidu-aip-sdk').ocr

const AipOcrClientMap = {}

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

function getConfig (interceptOpt, tryCount) {
  tryCount = tryCount || 1

  if (typeof (interceptOpt.baiduOcr) && interceptOpt.baiduOcr.length > 0) {
    const config = interceptOpt.baiduOcr[count % interceptOpt.baiduOcr.length]
    count++

    if (tryCount < interceptOpt.baiduOcr.length) {
      if (!config.id || !config.ak || !config.sk) {
        return getConfig(interceptOpt, tryCount + 1) // 递归找到有效的配置
      }
    }

    // 避免count值过大，造成问题
    if (count >= 10000) count = 0

    return config
  } else {
    return interceptOpt.baiduOcr
  }
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
      res.write('{"error": "图片Base64参数为空"}')
      res.end()
      return true
    }
    imageBase64 = decodeURIComponent(imageBase64)

    const config = getConfig(interceptOpt)
    if (!config.id || !config.ak || !config.sk) {
      res.writeHead(500, headers)
      res.write('{"error": "dev-sidecar中，baiduOcr的 id 或 ak 或 sk 配置为空"}')
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
      log.info('baiduOcr success:', result)
      headers['DS-Interceptor'] = `baiduOcr: id=${config.id},ak=${config.ak},sk=${config.sk}`
      res.writeHead(200, headers)
      res.write(JSON.stringify(result)) // 格式如：{"words_result":[{"words":"6525"}],"words_result_num":1,"log_id":1818877093747960000}
      res.end()
      if (next) next() // 异步执行完继续next
    }).catch(function (err) {
      log.info('baiduOcr error:', err)
      res.writeHead(500, headers)
      res.write('{"error": "' + err + '"}') // 格式如：{"words_result":[{"words":"6525"}],"words_result_num":1,"log_id":1818877093747960000}
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
