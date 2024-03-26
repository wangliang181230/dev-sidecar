module.exports = {
  name: 'sni',
  priority: 122,
  requestIntercept (context, interceptOpt) {
    const { rOptions, log } = context

    rOptions.servername = interceptOpt.sni
    if (rOptions.agent && rOptions.agent.options) {
      rOptions.agent.options.rejectUnauthorized = false
    }
    log.info('sni intercept: sni replace servername:', rOptions.hostname, '➜', rOptions.servername)

    return true
  },
  is (interceptOpt) {
    return !!interceptOpt.sni && !interceptOpt.proxy // proxy生效时，sni不生效，因为proxy中也会使用sni覆盖 rOptions.servername
  }
}
