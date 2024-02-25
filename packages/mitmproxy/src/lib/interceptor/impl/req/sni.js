module.exports = {
  name: 'sni',
  priority: 32,
  requestIntercept (context, interceptOpt) {
    const { rOptions, log } = context
    if (interceptOpt.sni != null) {
      rOptions.servername = interceptOpt.sni
      log.info('sni intercept: sni replace servername:', rOptions.hostname, '➜', rOptions.servername)
    }
  },
  is (interceptOpt) {
    return !!interceptOpt.sni && !interceptOpt.proxy // proxy生效时，sni不生效，因为proxy中也会覆盖sni
  }
}
