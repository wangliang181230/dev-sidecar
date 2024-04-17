const log = require('../../../../utils/util.log')
const through = require('through2')
const { httpUtil, handleResponseHeaders } = require('../../../proxy/middleware/InsertScriptMiddleware')
const monkey = require('../../../monkey')

const USER_SCRIPT_TAG_START = '// ==UserScript=='
const USER_SCRIPT_TAG_END = '// ==/UserScript=='

function chunkByteReplace (_this, chunk, enc, callback) {
  const ret = injectScriptIntoHtml(chunk)
  if (ret != null) {
    chunk = ret
  }
  _this.push(chunk)
  callback()
}

function injectScriptIntoHtml (chunk) {
  const indexStart = chunk.indexOf(USER_SCRIPT_TAG_START)
  const indexEnd = chunk.indexOf(USER_SCRIPT_TAG_END)
  if (indexStart < 0 || indexEnd < 0) {
    return null
  }

  const script = monkey.loadScript(chunk.toString())
  log.debug('monkey_script:', script)

  const scriptBuf = Buffer.from(script)
  const chunkNew = Buffer.alloc(scriptBuf.length)
  scriptBuf.copy(chunkNew, 0, 0)
  return chunkNew
}

module.exports = {
  name: 'monkeyScript',
  priority: 203,
  responseIntercept (context, interceptOpt, req, res, proxyReq, proxyRes, ssl) {
    const { rOptions, log, setting } = context

    if (proxyRes.headers['content-length'] === 0) {
      res.setHeader('DS-MonkeyScript-Interceptor', false)
      return
    }

    res.setHeader('DS-MonkeyScript-Interceptor', true)

    const url = `${rOptions.method} ➜ ${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}${req.url}`
    log.info('monkeyScript intercept:', url)

    log.info('proxyRes.status:', proxyRes.statusCode)

    // 先处理头信息
    handleResponseHeaders(res, proxyRes)

    // 获取响应内容编码
    const encoding = httpUtil.getContentEncoding(proxyRes)
    if (encoding) {
      // 获取编解码器
      const codec = httpUtil.getCodec(encoding)
      if (codec) {
        // 获取编码对应的解压缩方法
        proxyRes
          .pipe(codec.createDecompressor())
          .pipe(through(function (chunk, enc, callback) {
            chunkByteReplace(this, chunk, enc, callback)
          }))
          .pipe(codec.createCompressor())
          .pipe(res)
      } else {
        log.error(`InsertScriptMiddleware.responseInterceptor(): 暂不支持编码方式 ${encoding}, 目前支持:`, httpUtil.supportedEncodingsStr())
      }
    } else {
      proxyRes
        .pipe(through(function (chunk, enc, callback) {
          chunkByteReplace(this, chunk, enc, callback)
        }))
        .pipe(res)
    }
  },
  is (interceptOpt) {
    return interceptOpt.monkeyScript
  }
}
