const net = require('net')
const url = require('url')
const log = require('../../../utils/util.log')
const DnsUtil = require('../../dns/index')
const localIP = '127.0.0.1'
const defaultDns = require('dns')
const speedTest = require('../../speed/index.js')
function isSslConnect (sslConnectInterceptors, req, cltSocket, head) {
  for (const intercept of sslConnectInterceptors) {
    const ret = intercept(req, cltSocket, head)
    if (ret === false) {
      return false
    }
    if (ret === true) {
      return true
    }
    // continue
  }
  return false
}

// create connectHandler function
module.exports = function createConnectHandler (sslConnectInterceptor, middlewares, fakeServerCenter, dnsConfig, sniConfig) {
  // return
  const sslConnectInterceptors = []
  sslConnectInterceptors.push(sslConnectInterceptor)
  for (const middleware of middlewares) {
    if (middleware.sslConnectInterceptor) {
      sslConnectInterceptors.push(middleware.sslConnectInterceptor)
    }
  }

  // log.info('sni config:', sniConfig)
  // const sniRegexpMap = matchUtil.domainMapRegexply(sniConfig)
  return function connectHandler (req, cltSocket, head) {
    // eslint-disable-next-line node/no-deprecated-api
    const { hostname, port } = url.parse(`https://${req.url}`)
    if (isSslConnect(sslConnectInterceptors, req, cltSocket, head)) {
      fakeServerCenter.getServerPromise(hostname, port).then((serverObj) => {
        log.info('')
        log.info(`-----***** fakeServer connect: ${localIP}:${serverObj.port} ➜ ${req.url} *****-----`)
        connect(req, cltSocket, head, localIP, serverObj.port)
      }, (e) => {
        log.error(`--- fakeServer getServerPromise error: ${hostname}:${port}, exception:`, e)
      })
    } else {
      log.info(`未匹配到任何拦截器: ${req.url}`)
      connect(req, cltSocket, head, hostname, port, dnsConfig/* , sniRegexpMap */)
    }
  }
}

function connect (req, cltSocket, head, hostname, port, dnsConfig/* , sniRegexpMap */) {
  // tunneling https
  // log.info('connect:', hostname, port)
  const start = new Date().getTime()
  let isDnsIntercept = null
  const hostport = `${hostname}:${port}`
  // const replaceSni = matchUtil.matchHostname(sniRegexpMap, hostname)
  try {
    const options = {
      port,
      host: hostname,
      connectTimeout: 10000
    }
    if (dnsConfig) {
      const dns = DnsUtil.hasDnsLookup(dnsConfig, hostname)
      if (dns) {
        options.lookup = (hostname, options, callback) => {
          const tester = speedTest.getSpeedTester(hostname)
          if (tester) {
            const ip = tester.pickFastAliveIp()
            if (ip) {
              log.info(`-----${hostname} use alive ip:${ip}-----`)
              callback(null, ip, 4)
              return
            }
          }
          dns.lookup(hostname).then(ip => {
            isDnsIntercept = { dns, hostname, ip }
            if (ip !== hostname) {
              log.info(`-----${hostname} use ip:${ip}-----`)
              callback(null, ip, 4)
            } else {
              defaultDns.lookup(hostname, options, callback)
            }
          })
        }
      }
    }
    const proxySocket = net.connect(options, () => {
      cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                'Proxy-agent: dev-sidecar\r\n' +
                '\r\n')
      log.info('Proxy connect start:', hostport)
      proxySocket.write(head)
      proxySocket.pipe(cltSocket)

      cltSocket.pipe(proxySocket)
    })
    cltSocket.on('timeout', (e) => {
      log.error(`cltSocket timeout: ${hostport}, errorMsg: ${e.message}`)
    })
    cltSocket.on('error', (e) => {
      log.error(`cltSocket error:   ${hostport}, errorMsg: ${e.message}`)
    })
    proxySocket.on('timeout', () => {
      const end = new Date().getTime()
      const errorMsg = `代理连接超时: ${hostport}, cost: ${end - start} ms`
      log.error(errorMsg)
      if (isDnsIntercept) {
        const { dns, ip, hostname } = isDnsIntercept
        dns.count(hostname, ip, true)
        log.error(`记录ip失败次数，用于优选ip！ hostname: ${hostname}, ip: ${ip}, reason: ${errorMsg}, dns:`, JSON.stringify(dns))
      }
      cltSocket.write('HTTP/1.1 408 Proxy connect timeout\r\n' +
          'Proxy-agent: dev-sidecar\r\n' +
          '\r\n')
      cltSocket.end()
    })
    proxySocket.on('error', (e) => {
      // 连接失败，可能被GFW拦截，或者服务端拥挤
      const end = new Date().getTime()
      const errorMsg = `代理连接失败: ${hostport}, cost: ${end - start} ms, errorMsg: ${e.message}`
      log.error(errorMsg)
      if (isDnsIntercept) {
        const { dns, ip, hostname } = isDnsIntercept
        dns.count(hostname, ip, true)
        log.error(`记录ip失败次数，用于优选ip！ hostname: ${hostname}, ip: ${ip}, reason: ${errorMsg}, dns:`, JSON.stringify(dns))
      }
      cltSocket.write(`HTTP/1.1 400 Proxy connect error: ${e.message}\r\n` +
          'Proxy-agent: dev-sidecar\r\n' +
          '\r\n')
      cltSocket.end()
    })
    return proxySocket
  } catch (e) {
    log.error(`Proxy connect error: ${hostport}, exception:`, e)
  }
}
