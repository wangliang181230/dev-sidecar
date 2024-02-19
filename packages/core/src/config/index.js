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
      url: 'https://gitee.com/wangliang181230/dev-sidecar/raw/myself/packages/core/src/config/remote_config.json'
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
  proxy: {
    excludeIpArr: [
      // region 常用国内可访问域名

      // 中国大陆
      '*.cn',
      'cn.*',
      '*china*',

      // 系统之家
      '*.xitongzhijia.net',

      // CSDN
      '*.csdn.net',

      // 百度
      '*.baidu.com',
      '*.baiducontent.com',
      '*.bdimg.com',
      '*.bdstatic.com',
      '*.bdydns.com',

      // 腾讯
      '*.tencent.com',
      '*.qq.com',
      '*.weixin.com',
      '*.weixinbridge.com',
      '*.wechat.com',
      '*.idqqimg.com',
      '*.gtimg.com',
      '*.qpic.com',
      '*.qlogo.com',
      '*.myapp.com',
      '*.myqcloud.com',

      // 阿里
      '*.aliyun.com',
      '*.alipay.com',
      '*.taobao.com',
      '*.tmall.com',
      '*.alipayobjects.com',
      '*.dingtalk.com',
      '*.mmstat.com',
      '*.alicdn.com',
      '*.hdslb.com',

      // Gitee
      'gitee.com',
      '*.gitee.com',
      '*.gitee.io',
      '*.giteeusercontent.com',

      // Mozilla Firefox
      '*.mozilla.org',
      '*.mozilla.com',
      '*.mozilla.net',
      '*.firefox.com',
      '*.firefox.org',
      '*.mozillademos.org',
      '*.mozillians.org',
      '*.mozillians.net',
      '*.mozillians.com',

      // OSS
      '*.sonatype.org',
      // Maven镜像
      '*.maven.org',
      // Maven Repository
      '*.mvnrepository.com',
      'challenges.cloudflare.com', // 访问 mvnrepository.com 时有个人机校验时使用，国内可直接访问，所以不需要代理，代理了反而变慢了。

      // 苹果
      '*.apple.com',
      '*.icloud.com',

      // 微软
      '*.microsoft.com',
      '*.windows.com',
      '*.office.com',
      '*.office.net',
      '*.live.com',
      '*.msn.com',

      // WPS
      '*.wps.com',

      // 奇虎
      '*.qihoo.com',
      '*.qihucdn.com',
      // 360
      '*.360.com',
      '*.360safe.com',
      '*.360buyimg.com',
      '*.360buy.com',

      // 京东
      '*.jd.com',
      '*.jcloud.com',
      '*.jcloudcs.com',
      '*.jcloudcache.com',
      '*.jcloudcdn.com',
      '*.jcloudlb.com',

      // 哔哩哔哩
      '*.bilibili.com',
      '*.bilivideo.com.com',
      '*.biliapi.net',

      // 移动
      '*.10086.com',
      '*.10086cloud.com',

      // 移动：139邮箱
      '*.139.com',

      // 迅雷
      '*.xunlei.com',

      // 网站ICP备案查询
      '*.icpapi.com',

      // AGE动漫
      '*.agedm.*',
      '*.zhimg.com',
      '*.bdxiguaimg.com',
      '*.toutiaoimg.com',
      '*.bytecdntp.com',
      '*.bytegoofy.com',
      '*.toutiao.com',
      '*.toutiaovod.com',
      '*.aliyuncs.com',
      '*.127.net',
      '43.240.74.134',

      // ZzzFun
      '*.zzzfun.one',
      '*.zzzfun.vip',

      // 必应
      '*.bing.com',

      // 我的个人域名
      '*.easyj.icu',

      // 未知公司
      '*.bcebos.com',
      'icannwiki.org',
      '*.icannwiki.org',
      '*.sectigo.com',
      '*.pingdom.net',

      // endregion

      // -----------------------------------------

      // 本地
      'localhost',
      'localhost.*',
      '127.*',
      'test.*',
      // 服务端常用域名
      '10.*',
      '172.16.*',
      '172.17.*',
      '172.18.*',
      '172.19.*',
      '172.20.*',
      '172.21.*',
      '172.22.*',
      '172.23.*',
      '172.24.*',
      '172.25.*',
      '172.26.*',
      '172.27.*',
      '172.28.*',
      '172.29.*',
      '172.30.*',
      '172.31.*',
      // 局域网
      '192.168.*'
    ]
  },
  plugin: {}
}
