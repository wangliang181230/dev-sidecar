const interceptorImpls = require('./lib/interceptor')
const dnsUtil = require('./lib/dns')
const log = require('./utils/util.log')
const matchUtil = require('./utils/util.match')
const path = require('path')
const lodash = require('lodash')

const createOverwallMiddleware = require('./lib/proxy/middleware/overwall')

function buildIntercepts (intercepts) {
  // 为了简化 script 拦截器配置脚本绝对地址，这里特殊处理一下
  for (const hostnamePattern in intercepts) {
    const hostnameConfig = intercepts[hostnamePattern]

    const scriptProxy = {}
    for (const pathPattern in hostnameConfig) {
      const pathConfig = hostnameConfig[pathPattern]
      if (typeof pathConfig.script === 'object' && pathConfig.script.length > 0) {
        for (let i = 0; i < pathConfig.script.length; i++) {
          const script = pathConfig.script[i]
          if (script.indexOf('https:') === 0 || script.indexOf('http:') === 0) {
            const scriptKey = '/____ds_script_proxy____/' + script.replace(/\W/g, '') + '.js' // 伪脚本地址：移除 script 中可能存在的特殊字符，并转为相对地址
            scriptProxy[scriptKey] = script
            log.info(`替换配置：'${pathConfig.script[i]}' -> '${scriptKey}'`)
            pathConfig.script[i] = scriptKey
          }
        }
      }
    }

    // 自动创建脚本
    if (!lodash.isEmpty(scriptProxy)) {
      for (const scriptKey in scriptProxy) {
        const scriptUrl = scriptProxy[scriptKey]

        const pathPattern = `^${scriptKey.replace(/\./g, '\\.')}$`
        hostnameConfig[pathPattern] = {
          proxy: scriptUrl,
          response: { headers: { 'content-type': 'application/javascript; charset=utf-8' } },
          cacheDays: 7,
          desc: "伪脚本地址代理配置，并设置响应头 `content-type: 'application/javascript; charset=utf-8'`，同时缓存7天。"
        }

        const obj = {}
        obj[pathPattern] = hostnameConfig[pathPattern]
        log.info(`域名 '${hostnamePattern}' 拦截配置中，新增伪脚本地址的代理配置:`, obj)
      }
    }
  }

  return intercepts
}

module.exports = (config) => {
  const intercepts = matchUtil.domainMapRegexply(buildIntercepts(config.intercepts))
  const whiteList = matchUtil.domainMapRegexply(config.whiteList)

  const dnsMapping = config.dns.mapping
  const serverConfig = config
  const setting = serverConfig.setting

  if (!setting.script.dirAbsolutePath) {
    setting.script.dirAbsolutePath = path.join(setting.rootDir, setting.script.defaultDir)
  }
  if (setting.verifySsl !== false) {
    setting.verifySsl = true
  }

  const overwallConfig = serverConfig.plugin.overwall
  if (!overwallConfig.pac.pacFileAbsolutePath) {
    overwallConfig.pac.pacFileAbsolutePath = path.join(setting.rootDir, overwallConfig.pac.pacFilePath)
  }

  // 插件列表
  const middlewares = []

  // 梯子插件：如果启用了，则添加到插件列表中
  const overwallMiddleware = createOverwallMiddleware(overwallConfig)
  if (overwallMiddleware) {
    middlewares.push(overwallMiddleware)
  }

  const options = {
    host: serverConfig.host,
    port: serverConfig.port,
    dnsConfig: {
      providers: dnsUtil.initDNS(serverConfig.dns.providers),
      mapping: matchUtil.domainMapRegexply(dnsMapping),
      speedTest: config.dns.speedTest
    },
    setting,
    sniConfig: serverConfig.sniList,
    middlewares,
    sslConnectInterceptor: (req, cltSocket, head) => {
      const hostname = req.url.split(':')[0]
      const inWhiteList = matchUtil.matchHostname(whiteList, hostname, 'in whiteList') != null
      if (inWhiteList) {
        log.info('为白名单域名:', hostname,
          '\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\treferer:', req.headers.Referer || req.headers.referer,
          '\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\torigin:', req.headers.Origin || req.headers.origin,
          '\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t\tuserAgent:', req.headers['User-Agent'] || req.headers['user-agent']
        )
        return false // 所有都不拦截
      }
      // 配置了拦截的域名，将会被代理
      const matched = !!matchUtil.matchHostname(intercepts, hostname, 'matched intercepts')
      if (matched === true) {
        return matched // 拦截
      }
      return null // 未匹配到任何拦截配置，由下一个拦截器判断
    },
    createIntercepts: (context) => {
      const rOptions = context.rOptions
      const interceptOpts = matchUtil.matchHostnameAll(intercepts, rOptions.hostname, 'get interceptOpts')
      if (!interceptOpts) { // 该域名没有配置拦截器，直接过
        return
      }

      const matchIntercepts = []
      const matchInterceptsOpts = {}
      for (const regexp in interceptOpts) { // 遍历拦截配置
        // 判断是否匹配拦截器
        let matched
        if (regexp !== true && regexp !== 'true') {
          matched = matchUtil.isMatched(rOptions.path, regexp)
          if (matched == null) { // 拦截器匹配失败
            continue
          }
        }

        // 获取拦截器
        const interceptOpt = interceptOpts[regexp]
        // interceptOpt.key = regexp

        // log.info(`interceptor matched, regexp: '${regexp}' =>`, JSON.stringify(interceptOpt), ', url:', url)
        for (const impl of interceptorImpls) {
          // 根据拦截配置挑选合适的拦截器来处理
          if (impl.is && impl.is(interceptOpt)) {
            let action = 'add'

            // 如果存在同名拦截器，则order值越大，优先级越高
            const matchedInterceptOpt = matchInterceptsOpts[impl.name]
            if (matchedInterceptOpt) {
              if (matchedInterceptOpt.order >= interceptOpt.order) {
                // log.warn(`duplicate interceptor: ${impl.name}, hostname: ${rOptions.hostname}`)
                continue
              }
              action = 'replace'
            }

            const interceptor = { name: impl.name, priority: impl.priority }
            if (impl.requestIntercept) {
              // req拦截器
              interceptor.requestIntercept = (context, req, res, ssl, next) => {
                return impl.requestIntercept(context, interceptOpt, req, res, ssl, next, matched)
              }
            } else if (impl.responseIntercept) {
              // res拦截器
              interceptor.responseIntercept = (context, req, res, proxyReq, proxyRes, ssl, next) => {
                return impl.responseIntercept(context, interceptOpt, req, res, proxyReq, proxyRes, ssl, next, matched)
              }
            }

            // log.info(`${action} interceptor: ${impl.name}, hostname: ${rOptions.hostname}, regexp: ${regexp}`)
            if (action === 'add') {
              matchIntercepts.push(interceptor)
            } else {
              matchIntercepts[matchedInterceptOpt.index] = interceptor
            }
            matchInterceptsOpts[impl.name] = {
              order: interceptOpt.order || 0,
              index: matchIntercepts.length - 1
            }
          }
        }
      }

      matchIntercepts.sort((a, b) => { return a.priority - b.priority })
      // for (const interceptor of matchIntercepts) {
      //   log.info('interceptor:', interceptor.name, 'priority:', interceptor.priority)
      // }

      return matchIntercepts
    }
  }

  if (setting.rootCaFile) {
    options.caCertPath = setting.rootCaFile.certPath
    options.caKeyPath = setting.rootCaFile.keyPath
  }
  return options
}
