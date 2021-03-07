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

module.exports = {
  getCloudInitOutputLog,
}
