module.exports = {
  name: 'Git.exe代理',
  enabled: true, // 默认开启Git代理（和master分支不同）
  tip: '如果你没有安装git命令行则不需要启动它',
  setting: {
    sslVerify: true, // Git.exe 是否关闭sslVerify，true=关闭 false=开启
    noProxyUrls: {
      'https://gitee.com': true,
      'https://e.coding.net': true
    }
  }
}
