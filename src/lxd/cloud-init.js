const { exec, spawn } = require('child_process')

const getCloudInitOutputLog = async function (containerName) {
  return new Promise((resolve, reject) => {
    exec(
      `lxc exec ${containerName} -- cat /var/log/cloud-init-output.log`,
      (err, stdout, stderr) => {
        if (err) {
          reject(err)
        } else if (stderr) {
          reject(stderr)
        } else {
          resolve(stdout)
        }
      }
    )
  })
}

const getCloudInitStatus = async function (containerName) {
  return new Promise((resolve, reject) => {
    exec(
      `lxc exec ${containerName} -- cloud-init status`,
      (err, stdout, stderr) => {
        if (err) {
          reject(err)
        } else if (stderr) {
          reject(stderr)
        } else {
          console.log(stdout.replace('status: ', ''))
          resolve(stdout.replace('status: ', ''))
        }
      }
    )
  })
}

module.exports = {
  getCloudInitOutputLog,
  getCloudInitStatus,
}
