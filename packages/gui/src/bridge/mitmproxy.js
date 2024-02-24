// eslint-disable-next-line no-unused-vars
const log = require('../utils/util.log')
const server = require('@docmirror/mitmproxy')
const configPath = process.argv[2]
const fs = require('fs')
const path = require('path')
const configJson = fs.readFileSync(configPath)
const config = JSON.parse(configJson.toString())
log.info('读取 running.json 文件:', configPath)
// const scriptDir = '../extra/scripts/'
// config.setting.script.defaultDir = path.join(__dirname, scriptDir)
// const pacFilePath = '../extra/pac/pac.txt'
// config.plugin.overwall.pac.customPacFilePath = path.join(__dirname, pacFilePath)
config.setting.rootDir = path.join(__dirname, '../')
log.info(`start mitmproxy config by gui bridge: ${configPath}`)
server.start(config)
