// import api from './api/front'
import autoStart from './auto-start/front'
import error from './error/front'
import fileSelector from './file-selector/front'
import onClose from './on-close/front'
import tongji from './tongji/front'
import update from './update/front'

const modules = {
  // api, // 核心接口模块
  error,
  fileSelector, // 文件选择模块
  tongji, // 统计模块
  update, // 自动更新
  autoStart,
  onClose,
}
export default {
  install (app, api, router) {
    for (const module in modules) {
      modules[module].install(app, api, router)
    }
  },
  ...modules,
}
