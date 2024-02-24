module.exports = {
  name: 'sni',
  priority: 15,
  requestIntercept (context, interceptOpt) {
    const { rOptions, log } = context
    if (interceptOpt.sni != null) {
      rOptions.servername = interceptOpt.sni
      log.info('sni intercept: sni replace servername:', rOptions.hostname, '➜', rOptions.servername)
    }
  },
  is (interceptOpt) {
    return !!interceptOpt.sni
  }
}
