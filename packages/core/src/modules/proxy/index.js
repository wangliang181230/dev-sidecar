const ProxyPlugin = function (context) {
  const { config, event, shell, log } = context
  const api = {
    async start () {
      return api.setProxy()
    },

    async close () {
      return api.unsetProxy()
    },

    async restart () {
      await api.close()
      await api.start()
    },

    async setProxy () {
      const ip = '127.0.0.1'
      const port = config.get().server.port
      const setEnv = config.get().proxy.setEnv
      await shell.setSystemProxy({ ip, port, setEnv })
      log.info(`开启系统代理成功：${ip}:${port}`)
      event.fire('status', { key: 'proxy.enabled', value: true })
      return { ip, port }
    },

    async unsetProxy (setEnv) {
      if (setEnv) {
        setEnv = config.get().proxy.setEnv
      }
      try {
        await shell.setSystemProxy({ setEnv })
        event.fire('status', { key: 'proxy.enabled', value: false })
        log.info('关闭系统代理成功')
        return true
      } catch (err) {
        log.error('关闭系统代理失败:', err)
        return false
      }
    },

    async setEnableLoopback () {
      await shell.enableLoopback()
      log.info('打开EnableLoopback成功')
      return true
    }
  }
  return api
}
module.exports = {
  key: 'proxy',
  config: {
    enabled: true,
    name: '系统代理',
    use: 'local',
    other: [],
    setEnv: false,
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
  status: {
    enabled: false,
    proxyTarget: ''
  },
  plugin: ProxyPlugin
}
