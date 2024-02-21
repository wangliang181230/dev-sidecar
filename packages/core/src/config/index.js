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
      enabled: false,
      url: 'https://gitee.com/wangliang181230/dev-sidecar/raw/remote_config/packages/core/src/config/remote_config.json'
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
      'github.com': {
        '/.*/.*/releases/download/': {
          redirect: 'download.fastgit.org',
          desc: 'release文件加速下载跳转地址'
        },
        '/.*/.*/archive/': {
          redirect: 'download.fastgit.org'
        },
        '/.*/.*/blame/': {
          redirect: 'hub.fastgit.org'
        },
        '^/[^/]+/[^/]+(/releases(/.*)?)?$': {
          script: [
            'github'
          ],
          desc: 'clone加速复制链接脚本'
        },
        '/.*': {
          proxy: 'github.com',
          desc: '目前禁掉sni就可以直接访问，如果后续github.com的ip被封锁，只能再走proxy模式',
          sni: 'baidu.com'
        }
      },
      'github-releases.githubusercontent.com': {
        '.*': {
          proxy: 'github-releases.githubusercontent.com',
          sni: 'baidu.com'
        }
      },
      'github.githubassets.com': {
        '.*': {
          proxy: 'github.githubassets.com',
          sni: 'baidu.com'
        }
      },
      'camo.githubusercontent.com': {
        '.*': {
          proxy: 'camo.githubusercontent.com',
          sni: 'baidu.com'
        }
      },
      'collector.github.com': {
        '.*': {
          proxy: 'collector.github.com',
          sni: 'baidu.com'
        }
      },
      'customer-stories-feed.github.com': {
        '.*': {
          proxy: 'customer-stories-feed.fastgit.org'
        }
      },
      'raw.githubusercontent.com': {
        '.*': {
          proxy: 'raw.githubusercontent.com',
          sni: 'baidu.com'
        }
      },
      'user-images.githubusercontent.com': {
        '.*': {
          proxy: 'user-images.githubusercontent.com',
          sni: 'baidu.com'
        }
      },
      'backup.avatars.githubusercontent.com': {
        desc: '注释：avatars.githubusercontent.com域名直连比较慢，暂时备份掉，如需再拦截，请将上面的 `backup.` 去掉。',
        '.*': {
          proxy: 'avatars.githubusercontent.com',
          sni: 'baidu.com'
        }
      },
      'api.github.com': {
        '^/_private/browser/stats$': {
          success: true,
          desc: 'github的访问速度分析上传，没有必要，直接返回成功'
        }
      },
      'hub.docker.com': {
        '.*': {
          proxy: 'hub.docker.com',
          sni: 'baidu.com'
        }
      },
      'api.dso.docker.com': {
        '.*': {
          proxy: 'api.dso.docker.com',
          sni: 'baidu.com'
        }
      },
      'api.segment.io': {
        '.*': {
          proxy: 'api.segment.io',
          sni: 'baidu.com'
        }
      },
      'www.google.com': {
        '/recaptcha/.*': {
          proxy: 'www.recaptcha.net'
        }
      },
      'www.gstatic.com': {
        '/recaptcha/.*': {
          proxy: 'www.recaptcha.net'
        }
      },
      'ajax.googleapis.com': {
        '.*': {
          proxy: 'ajax.lug.ustc.edu.cn',
          backup: [
            'gapis.geekzu.org'
          ],
          test: 'ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js'
        }
      },
      'fonts.googleapis.com': {
        '.*': {
          proxy: 'fonts.geekzu.org',
          backup: [
            'fonts.loli.net'
          ],
          test: 'https://fonts.googleapis.com/css?family=Oswald'
        }
      },
      'themes.googleapis.com': {
        '.*': {
          proxy: 'themes.loli.net',
          backup: [
            'themes.proxy.ustclug.org'
          ]
        }
      },
      'themes.googleusercontent.com': {
        '.*': {
          proxy: 'google-themes.proxy.ustclug.org'
        }
      },
      'clients*.google.com': {
        '.*': {
          abort: false,
          desc: '设置abort：true可以快速失败，节省时间'
        }
      },
      'www.googleapis.com': {
        '.*': {
          abort: false,
          desc: '设置abort：true可以快速失败，节省时间'
        }
      },
      'lh*.googleusercontent.com': {
        '.*': {
          abort: false,
          desc: '设置abort：true可以快速失败，节省时间'
        }
      },
      '*.s3.1amazonaws1.com': {
        '/sqlite3/.*': {
          redirect: 'npm.taobao.org/mirrors'
        }
      },
      '*.carbonads.com': {
        '/carbon.*': {
          abort: true,
          desc: '广告拦截'
        }
      },
      '*.buysellads.com': {
        '/ads/.*': {
          abort: true,
          desc: '广告拦截'
        }
      }
    },
    whiteList: {
      '*.cn': true,
      'cn.*': true,
      '*china*': true,
      'dingtalk.com': true,
      '*.dingtalk.com': true,
      'apple.com': true,
      '*.apple.com': true,
      'microsoft.com': true,
      '*.microsoft.com': true,
      'alipay.com': true,
      '*.alipay.com': true,
      'qq.com': true,
      '*.qq.com': true,
      'baidu.com': true,
      '*.baidu.com': true
    },
    sniList: {
    //   'github.com': 'abaidu.com'
    },
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
        '*github*.com': 'quad9',
        '*github.io': 'quad9',
        '*docker*.com': 'quad9',
        '*stackoverflow.com': 'quad9',
        '*.electronjs.org': 'quad9',
        '*amazonaws.com': 'quad9',
        '*yarnpkg.com': 'quad9',
        '*cloudfront.net': 'quad9',
        '*cloudflare.com': 'quad9',
        '*.vuepress.vuejs.org': 'quad9',
        'gh.docmirror.top': 'quad9',
        '*v2ex.com': 'quad9',
        '*pypi.org': 'quad9',
        '*jetbrains.com': 'quad9',
        '*azureedge.net': 'quad9'
      },
      speedTest: {
        enabled: true,
        interval: 300000,
        hostnameList: ['github.com', 'hub.docker.com', 'login.docker.com', 'api.dso.docker.com'],
        dnsProviders: ['usa', 'quad9']
      }
    }
  },
  proxy: {},
  plugin: {}
}
