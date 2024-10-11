const https = require('https')
const http = require('http')
const tlsUtils = require('./tlsUtils')
const CertAndKeyContainer = require('./CertAndKeyContainer')
const forge = require('node-forge')
const pki = forge.pki
// const colors = require('colors')
const tls = require('tls')
const log = require('../../../utils/util.log')

const sslCache = {}

function getSsl (hostname, port) {
  const ssl = sslCache[`${hostname}:${port}`]
  return ssl != null ? ssl : true
}

function setSsl (hostname, port, value) {
  sslCache[`${hostname}:${port}`] = value
}

function removeSsl (hostname, port) {
  delete sslCache[`${hostname}:${port}`]
}

module.exports = class FakeServersCenter {
  constructor ({ maxLength = 256, requestHandler, upgradeHandler, caCert, caKey, getCertSocketTimeout }) {
    this.queue = []
    this.maxLength = maxLength
    this.requestHandler = requestHandler
    this.upgradeHandler = upgradeHandler
    this.certAndKeyContainer = new CertAndKeyContainer({
      getCertSocketTimeout,
      caCert,
      caKey
    })
  }

  addServerPromise (serverPromiseObj) {
    if (this.queue.length >= this.maxLength) {
      const delServerObj = this.queue.shift()
      try {
        log.info('超过最大服务数量，删除旧服务。delServerObj:', delServerObj)
        delServerObj.serverObj.server.close()
      } catch (e) {
        log.error('`delServerObj.serverObj.server.close()` error:', e)
      }
    }
    this.queue.push(serverPromiseObj)
    return serverPromiseObj
  }

  getServerPromise (hostname, port) {
    const ssl = getSsl(hostname, port)
    log.info(`getServerPromise: ${hostname}:${port} ssl: ${ssl}`)

    for (let i = 0; i < this.queue.length; i++) {
      const serverPromiseObj = this.queue[i]
      if (serverPromiseObj.ssl === ssl) {
        const mappingHostNames = serverPromiseObj.mappingHostNames
        for (let j = 0; j < mappingHostNames.length; j++) {
          const DNSName = mappingHostNames[j]
          if (tlsUtils.isMappingHostName(DNSName, hostname)) {
            this.reRankServer(i)
            return serverPromiseObj.promise
          }
        }
      }
    }

    const serverPromiseObj = {
      ssl,
      mappingHostNames: [hostname] // temporary hostname
    }

    const promise = new Promise((resolve, reject) => {
      (async () => {
        let fakeServer
        let cert
        let key
        if (ssl) {
          const certObj = await this.certAndKeyContainer.getCertPromise(hostname, port)
          cert = certObj.cert
          key = certObj.key
          const certPem = pki.certificateToPem(cert)
          const keyPem = pki.privateKeyToPem(key)
          fakeServer = new https.Server({
            key: keyPem,
            cert: certPem,
            SNICallback: (hostname, done) => {
              (async () => {
                const certObj = await this.certAndKeyContainer.getCertPromise(hostname, port)
                log.info(`sni callback: ${hostname}:${port}`)
                done(null, tls.createSecureContext({
                  key: pki.privateKeyToPem(certObj.key),
                  cert: pki.certificateToPem(certObj.cert)
                }))
              })()
            }
          })
        } else {
          fakeServer = new http.Server()
        }
        const serverObj = {
          cert,
          key,
          server: fakeServer,
          port: 0 // if prot === 0 ,should listen server's `listening` event.
        }
        serverPromiseObj.serverObj = serverObj

        fakeServer.listen(0, () => {
          const address = fakeServer.address()
          serverObj.port = address.port
        })
        fakeServer.on('request', (req, res) => {
          log.debug(`【fakeServer request - ${hostname}:${port}】\r\n----- req -----\r\n`, req, '\r\n----- res -----\r\n', res)
          this.requestHandler(req, res, ssl)
        })
        fakeServer.on('listening', () => {
          log.debug(`【fakeServer listening - ${hostname}:${port}】no arguments...`)
          if (cert) {
            serverPromiseObj.mappingHostNames = tlsUtils.getMappingHostNamesFromCert(cert)
          }
          resolve(serverObj)
        })
        fakeServer.on('upgrade', (req, socket, head) => {
          log.debug(`【fakeServer upgrade - ${hostname}:${port}】\r\n----- req -----\r\n`, req, '\r\n----- socket -----\r\n', socket, '\r\n----- head -----\r\n', head)
          this.upgradeHandler(req, socket, head, ssl)
        })

        // 三个 error 事件
        fakeServer.on('error', (e) => {
          log.error(`【fakeServer error - ${hostname}:${port}】\r\n----- error -----\r\n`, e)
        })
        fakeServer.on('clientError', (err, socket) => {
          if (err.code.indexOf('ERR_SSL_') === 0) {
            setSsl(hostname, port, false)
            log.warn(`SSL异常，设置为不使用ssl: ${hostname}:${port}`)
          } else {
            removeSsl(hostname, port)
          }

          // log.error(`【fakeServer clientError - ${hostname}:${port}】\r\n----- error -----\r\n`, err, '\r\n----- socket -----\r\n', socket)
          log.error(`【fakeServer clientError - ${hostname}:${port}】\r\n`, err)
        })
        if (ssl) {
          fakeServer.on('tlsClientError', (err, tlsSocket) => {
            // log.error(`【fakeServer tlsClientError - ${hostname}:${port}】\r\n----- error -----\r\n`, err, '\r\n----- tlsSocket -----\r\n', tlsSocket)
            log.error(`【fakeServer tlsClientError - ${hostname}:${port}】\r\n`, err)
          })
        }

        // 其他监听事件，只打印debug日志
        if (process.env.NODE_ENV === 'development') {
          if (ssl) {
            fakeServer.on('keylog', (line, tlsSocket) => {
              log.debug(`【fakeServer keylog - ${hostname}:${port}】\r\n----- line -----\r\n`, line, '\r\n----- tlsSocket -----\r\n', tlsSocket)
            })
            // fakeServer.on('newSession', (sessionId, sessionData, callback) => {
            //   log.debug('【fakeServer newSession - ${hostname}:${port}】\r\n----- sessionId -----\r\n', sessionId, '\r\n----- sessionData -----\r\n', sessionData, '\r\n----- callback -----\r\n', callback)
            // })
            // fakeServer.on('OCSPRequest', (certificate, issuer, callback) => {
            //   log.debug('【fakeServer OCSPRequest - ${hostname}:${port}】\r\n----- certificate -----\r\n', certificate, '\r\n----- issuer -----\r\n', issuer, '\r\n----- callback -----\r\n', callback)
            // })
            // fakeServer.on('resumeSession', (sessionId, callback) => {
            //   log.debug('【fakeServer resumeSession - ${hostname}:${port}】\r\n----- sessionId -----\r\n', sessionId, '\r\n----- callback -----\r\n', callback)
            // })
            fakeServer.on('secureConnection', (tlsSocket) => {
              log.debug(`【fakeServer secureConnection - ${hostname}:${port}】\r\n----- tlsSocket -----\r\n`, tlsSocket)
            })
          }
          fakeServer.on('close', () => {
            log.debug(`【fakeServer close - ${hostname}:${port}】no arguments...`)
          })
          fakeServer.on('connection', (socket) => {
            log.debug(`【fakeServer connection - ${hostname}:${port}】\r\n----- socket -----\r\n`, socket)
          })
          fakeServer.on('checkContinue', (req, res) => {
            log.debug(`【fakeServer checkContinue - ${hostname}:${port}】\r\n----- req -----\r\n`, req, '\r\n----- res -----\r\n', res)
          })
          fakeServer.on('checkExpectation', (req, res) => {
            log.debug(`【fakeServer checkExpectation - ${hostname}:${port}】\r\n----- req -----\r\n`, req, '\r\n----- res -----\r\n', res)
          })
          fakeServer.on('connect', (req, socket, head) => {
            log.debug(`【fakeServer resumeSession - ${hostname}:${port}】\r\n----- req -----\r\n`, req, '\r\n----- socket -----\r\n', socket, '\r\n----- head -----\r\n', head)
          })
        }
      })()
    })

    serverPromiseObj.promise = promise

    return (this.addServerPromise(serverPromiseObj)).promise
  }

  reRankServer (index) {
    // index ==> queue foot
    this.queue.push((this.queue.splice(index, 1))[0])
  }
}
