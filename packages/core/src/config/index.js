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
      url: 'https://gitee.com/wangliang181230/dev-sidecar/raw/remote_config/packages/core/src/config/remote_config_myself.json'
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
          redirect: 'gh.api.99988866.xyz/https://github.com',
          desc: 'release文件加速下载跳转地址'
        },
        '/.*/.*/archive/': {
          redirect: 'gh.api.99988866.xyz/https://github.com'
        },
        '/.*/.*/blame/': {
          redirect: 'gh.api.99988866.xyz/https://github.com'
        },
        '^/[^/]+/[^/]+(/releases(/.*)?)?$': {
          script: [
            'github'
          ],
          desc: 'clone加速复制链接脚本'
        },
        '/.*': {
          desc: '目前禁掉sni就可以直接访问，如果后续github.com的ip被封锁，只能再走proxy模式',
          sni: 'baidu.com'
        },
        '/fluidicon.png': {
          cacheDays: 365,
          desc: 'Github那只猫的图片，缓存1年'
        },
        '^(/[^/]+){2}/pull/\\d+/open_with_menu.*$': {
          cacheDays: 7,
          desc: 'PR详情页：标题右边那个Code按钮的HTML代理请求地址，感觉上应该可以缓存。暂时先设置为缓存7天'
        }
      },
      'github-releases.githubusercontent.com': {
        '.*': {
          sni: 'baidu.com'
        }
      },
      'github.githubassets.com': {
        '.*': {
          sni: 'baidu.com'
        }
      },
      'camo.githubusercontent.com': {
        '.*': {
          sni: 'baidu.com'
        },
        '^[a-zA-Z0-9/]+(\\?.*)?$': {
          cacheDays: 365,
          desc: '图片，缓存1年'
        }
      },
      'collector.github.com': {
        '.*': {
          sni: 'baidu.com'
        }
      },
      'customer-stories-feed.github.com': {
        '.*': {
          sni: 'baidu.com'
        }
      },
      'raw.githubusercontent.com': {
        '.*': {
          sni: 'baidu.com'
        }
      },
      'user-images.githubusercontent.com': {
        '.*': {
          sni: 'baidu.com'
        },
        '^/.*\\.png(\\?.*)?$': {
          cacheDays: 365,
          desc: '用户在PR或issue等内容中上传的图片，缓存1年。注：每张图片都有唯一的ID，不会重复，可以安心缓存'
        }
      },
      'private-user-images.githubusercontent.com': {
        '.*': {
          sni: 'baidu.com'
        },
        '^/.*\\.png(\\?.*)?$': {
          cacheHours: 1,
          desc: '用户在PR或issue等内容中上传的图片，缓存1小时就够了，因为每次刷新页面都是不一样的链接。'
        }
      },
      'avatars.githubusercontent.com': {
        '.*': {
          sni: 'baidu.com'
        },
        '^/u/\\d+(\\?.*)?$': {
          cacheDays: 365,
          desc: '用户头像，缓存1年'
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
          sni: 'baidu.com'
        }
      },
      'api.dso.docker.com': {
        '.*': {
          sni: 'baidu.com'
        }
      },
      'login.docker.com': {
        '/favicon.ico': {
          proxy: 'hub.docker.com',
          sni: 'baidu.com'
        }
      },
      'api.segment.io': {
        '.*': {
          sni: 'baidu.com'
        }
      },
      'www.google.com': {
        '/recaptcha/.*': { proxy: 'www.recaptcha.net' }
      },
      'www.gstatic.com': {
        '/recaptcha/.*': { proxy: 'www.recaptcha.net' }
      },
      'ajax.googleapis.com': {
        '.*': {
          proxy: 'ajax.lug.ustc.edu.cn',
          backup: ['gapis.geekzu.org'],
          test: 'ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js'
        }
      },
      'fonts.googleapis.com': {
        '.*': {
          proxy: 'fonts.geekzu.org',
          backup: ['fonts.loli.net'],
          test: 'https://fonts.googleapis.com/css?family=Oswald'
        }
      },
      'themes.googleapis.com': {
        '.*': {
          proxy: 'themes.loli.net',
          backup: ['themes.proxy.ustclug.org']
        }
      },
      'themes.googleusercontent.com': {
        '.*': { proxy: 'google-themes.proxy.ustclug.org' }
      },
      'clients*.google.com': { '.*': { abort: false, desc: '设置abort：true可以快速失败，节省时间' } },
      'www.googleapis.com': { '.*': { abort: false, desc: '设置abort：true可以快速失败，节省时间' } },
      'lh*.googleusercontent.com': { '.*': { abort: false, desc: '设置abort：true可以快速失败，节省时间' } },
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
      // '*.cn': true,
      // 'cn.*': true,
      // '*china*': true,
      '*.dingtalk.com': true,
      '*.apple.com': true,
      '*.microsoft.com': true,
      '*.alipay.com': true,
      '*.qq.com': true,
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
        '*.github.com': 'quad9',
        '*github*.com': 'quad9',
        '*.github.io': 'quad9',
        '*.docker.com': 'quad9',
        '*.stackoverflow.com': 'quad9',
        '*.electronjs.org': 'quad9',
        '*.amazonaws.com': 'quad9',
        '*.yarnpkg.com': 'quad9',
        '*.cloudfront.net': 'quad9',
        '*.cloudflare.com': 'quad9',
        '*.vuepress.vuejs.org': 'quad9',
        '*.gh.docmirror.top': 'quad9',
        '*.v2ex.com': 'quad9',
        '*.pypi.org': 'quad9',
        '*.jetbrains.com': 'quad9',
        '*.azureedge.net': 'quad9'
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
