const path = require('path')
function getUserBasePath () {
  const userHome = process.env.USERPROFILE || process.env.HOME || '/'
  return path.resolve(userHome, './.dev-sidecar')
}
function getRootCaCertPath () {
  return getUserBasePath() + '/dev-sidecar.ca.crt'
}
function getRootCaKeyPath () {
  return getUserBasePath() + '/dev-sidecar.ca.key.pem'
}
module.exports = {
  app: {
    mode: 'ow',
    autoStart: {
      enabled: true
    },
    remoteConfig: {
      enabled: true,
      url: 'https://gitee.com/wangliang181230/dev-sidecar/raw/remote_config/remote_config.json'
    },
    dock: {
      hideWhenWinClose: false
    },
    closeStrategy: 2,
    showShutdownTip: false
  },
  server: {
    enabled: true,
    host: '127.0.0.1',
    port: 31181,
    setting: {
      NODE_TLS_REJECT_UNAUTHORIZED: true,
      verifySsl: true,
      script: {
        enabled: true,
        defaultDir: './extra/scripts/'
      },
      userBasePath: getUserBasePath(),
      rootCaFile: {
        certPath: getRootCaCertPath(),
        keyPath: getRootCaKeyPath()
      }
    },
    intercept: {
      enabled: true
    },
    intercepts: {
    },
    whiteList: {
    },
    // sniList: {
    //   'github.com': 'baidu.com'
    // },
    dns: {
      providers: {
        aliyun: {
          type: 'https',
          server: 'https://dns.alidns.com/dns-query',
          cacheSize: 1000
        },
        usa: {
          type: 'https',
          server: 'https://1.1.1.1/dns-query',
          cacheSize: 1000
        },
        quad9: {
          type: 'https',
          server: 'https://9.9.9.9/dns-query',
          cacheSize: 1000
        },
        rubyfish: {
          type: 'https',
          server: 'https://rubyfish.cn/dns-query',
          cacheSize: 1000
        }
      },
      mapping: {
      },
      speedTest: {
        enabled: true,
        interval: 300000//,
        // hostnameList: ['github.com', 'hub.docker.com', 'login.docker.com', 'api.dso.docker.com'],
        // dnsProviders: ['usa', 'quad9']
      }
    }
  },
  proxy: {},
  plugin: {}
}
