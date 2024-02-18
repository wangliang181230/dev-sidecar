module.exports = {
  name: '梯子',
  enabled: true, // 默认开启梯子
  server: {},
  serverDefault: {
    'ow-prod.docmirror.top': {
      port: 443,
      path: 'X2dvX292ZXJfd2FsbF8',
      password: 'dev_sidecar_is_666'
    }
  },
  targets: {
  },
  pac: {
    enabled: true,
    // update: [
    //   'https://gitlab.com/gfwlist/gfwlist/raw/master/gfwlist.txt'
    // ],
    pacFilePath: './extra/pac/pac.txt'
  }
}
