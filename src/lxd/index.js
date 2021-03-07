const fs = require('fs')
const instances = require('./instances')
const operations = require('./operations')
const profiles = require('./profiles')
const { exec } = require('child_process')
const cloudInit = require('./cloud-init')

const isInit = async function ({ lxdEndpoint, agent }) {
  const defaultProfile = await profiles.get({
    lxdEndpoint,
    agent,
    profileName: 'default',
  })
  console.log(Object.keys(defaultProfile.devices))
  return Object.keys(defaultProfile.devices).length > 0
}

const certExists = async function () {
  return (
    fs.existsSync('./certificates/lxd.crt') &&
    fs.existsSync('./certificates/lxd.key')
  )
}

const initializeCerts = async function (context) {
  if (!certsExist()) {
    // Generate key
    await new Promise((resolve, reject) => {
      exec(
        `openssl ecparam -name prime256v1 -genkey -noout -out ./certificates/lxd.key`,
        (err, stdout, stderr) => {
          if (err) console.error(err)
          if (stderr) console.error(stderr)
        }
      )
    })
    // Generate certificate
    await new Promise((resolve, reject) => {
      exec(
        `openssl req -new -x509 -key ./certificates/lxd.key -subj "/C=US/ST=California/L=Upland/O=JAR Automation/CN=jarautomation.io" -out ./certificates/lxd.crt -days 365`,
        (err, stdout, stderr) => {
          if (err) console.error(err)
          if (stderr) console.error(stderr)
        }
      )
    })
    // TODO authenticate certificate
  }
}

module.exports = {
  instances,
  operations,
  profiles,
  isInit,
  certExists,
  cloudInit,
}
