const log = require('../../../utils/util.log')
const through = require('through2')
const zlib = require('zlib')

const httpUtil = {
  // 获取编码
  getContentEncoding (res) {
    return res.headers['content-encoding']
  },
  // 获取压缩方法
  getCompression (encoding) {
    switch (encoding) {
      case 'gzip':
        return zlib.createGunzip()
      case 'deflate':
        return zlib.createInflate()
      default:
        return null
    }
  },
  // 获取解压方法
  getDecompression (encoding) {
    switch (encoding) {
      case 'gzip':
        return zlib.createGzip()
      case 'deflate':
        return zlib.createDeflate()
      default:
        return null
    }
  },
  isHtml (res) {
    const contentType = res.headers['content-type']
    return (typeof contentType !== 'undefined') && /text\/html|application\/xhtml\+xml/.test(contentType)
  }
}
const HEAD = Buffer.from('</head>')
const HEAD_UP = Buffer.from('</HEAD>')
const BODY = Buffer.from('</body>')
const BODY_UP = Buffer.from('</BODY>')

function chunkByteReplace (_this, chunk, enc, callback, append) {
  if (append) {
    if (append.head) {
      const ret = injectScriptIntoHtml([HEAD, HEAD_UP], chunk, append.head)
      if (ret != null) {
        chunk = ret
      }
    }
    if (append.body) {
      const ret = injectScriptIntoHtml([BODY, BODY_UP], chunk, append.body)
      if (ret != null) {
        chunk = ret
      }
    }
  }
  _this.push(chunk)
  callback()
}

function injectScriptIntoHtml (tags, chunk, script) {
  for (const tag of tags) {
    const index = chunk.indexOf(tag)
    if (index < 0) {
      continue
    }
    const scriptBuf = Buffer.from(script)
    const chunkNew = Buffer.alloc(chunk.length + scriptBuf.length)
    chunk.copy(chunkNew, 0, 0, index)
    scriptBuf.copy(chunkNew, index, 0)
    chunk.copy(chunkNew, index + scriptBuf.length, index)
    return chunkNew
  }
  return null
}

const contextPath = '/____ds_script____/'
const monkey = require('../../monkey')
module.exports = {
  requestIntercept (context, req, res, ssl, next) {
    const { rOptions, log, setting } = context
    if (rOptions.path.indexOf(contextPath) !== 0) {
      return
    }
    const urlPath = rOptions.path
    const filename = urlPath.replace(contextPath, '')

    const script = monkey.get(setting.script.defaultDir)[filename]
    // log.info(`urlPath: ${urlPath}, fileName: ${filename}, script: ${script}`)

    log.info('ds_script, filename:', filename, ', `script != null` =', script != null)
    const now = new Date()
    res.writeHead(200, {
      'DS-Middleware': 'ds_script',
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=86401, immutable', // 缓存1天
      'Last-Modified': now.toUTCString(),
      Expires: new Date(now.getTime() + 86400000).toUTCString(), // 缓存1天
      Date: new Date().toUTCString()
    })
    res.write(script.script)
    res.end()
    return true
  },
  responseInterceptor (req, res, proxyReq, proxyRes, ssl, next, append) {
    if (!append.head && !append.body) {
      next()
      return
    }

    const isHtml = httpUtil.isHtml(proxyRes)
    const contentLengthIsZero = (() => {
      return proxyRes.headers['content-length'] === 0
    })()
    if (!isHtml || contentLengthIsZero) {
      next()
      return
    }

    Object.keys(proxyRes.headers).forEach(function (key) {
      if (proxyRes.headers[key] !== undefined) {
        // let newkey = key.replace(/^[a-z]|-[a-z]/g, (match) => {
        //   return match.toUpperCase()
        // })
        const newkey = key
        if (isHtml && key === 'content-length') {
          // do nothing
          return
        }
        if (isHtml && key === 'content-security-policy') {
          // content-security-policy
          let policy = proxyRes.headers[key]
          const reg = /script-src ([^:]*);/i
          const matched = policy.match(reg)
          if (matched) {
            if (matched[1].indexOf('self') < 0) {
              policy = policy.replace('script-src', 'script-src \'self\' ')
            }
          }
          res.setHeader(newkey, policy)
          return
        }

        res.setHeader(newkey, proxyRes.headers[key])
      }
    })

    res.writeHead(proxyRes.statusCode)

    // 获取编码及其对应的压缩方法
    const encoding = httpUtil.getContentEncoding(proxyRes)
    const compress = httpUtil.getCompression(encoding)
    if (encoding) {
      if (compress) {
        // 获取编码对应的解压方法
        const decompress = httpUtil.getDecompression(encoding)
        proxyRes
          .pipe(decompress)
          .pipe(through(function (chunk, enc, callback) {
            chunkByteReplace(this, chunk, enc, callback, append)
          }))
          .pipe(compress)
          .pipe(res)
      } else {
        log.warn(`InsertScriptMiddleware：暂不支持编码方式: ${encoding}, 目前支持: Gzip、Deflate`)
      }
      next()
      return
    }

    if (compress == null) {
      proxyRes.pipe(through(function (chunk, enc, callback) {
        chunkByteReplace(this, chunk, enc, callback, append)
      })).pipe(res)
    }

    next()
  },
  httpUtil
}
