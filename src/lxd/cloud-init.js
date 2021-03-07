const { exec, spawn } = require('child_process')

const getCloudInitOutputLog = async function (containerName) {
  return new Promise((resolve, reject) => {
    exec(
      `lxd exec ${containerName} -- cat /var/log/cloud-init-output.log`,
      (err, stdout, stderr) => {
        if (err) console.error(err)
        if (stderr) console.error(stderr)
      }
    )
  })
}

module.export = {
  getCloudInitOutputLog,
}
