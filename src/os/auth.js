const { exec } = require('child_process')

const getUsers = async function () {
  const ignore = [
    'root',
    'daemon',
    'bin',
    'sys',
    'sync',
    'games',
    'man',
    'lp',
    'mail',
    'news',
    'uucp',
    'proxy',
    'www-data',
    'backup',
    'list',
    'irc',
    'gnats',
    'nobody',
    'systemd-network',
    'systemd-resolve',
    'systemd-timesync',
    'messagebus',
    'syslog',
    '_apt',
    'tss',
    'uuidd',
    'tcpdump',
    'landscape',
    'pollinate',
    'sshd',
    'systemd-coredump',
    'lxd',
  ]
  return new Promise((resolve, reject) => {
    exec(`cut -d: -f1 /etc/passwd`, (err, stdout, stderr) => {
      resolve(
        stdout.split('\n').filter((username) => {
          return !ignore.includes(username)
        })
      )
    })
  })
}

const createUser = async function (username, password) {
  return new Promise((resolve, reject) => {
    exec(
      `sudo useradd -m -p $(openssl passwd -1 ${password}) -G sudo -s /bin/bash ${username}`,
      (err, stdout, stderr) => {
        if (err) {
          reject(err)
        } else if (stderr) {
          reject(stderr)
        } else {
          resolve({ username })
        }
      }
    )
  })
}

const deleteUser = async function (username) {
  return new Promise((resolve, reject) => {
    exec(
      `sudo userdel ${username} && sudo rm -r /home/${username}`,
      (err, stdout, stderr) => {
        if (err) {
          reject(err)
        } else if (stderr) {
          reject(stderr)
        } else {
          resolve({ username })
        }
      }
    )
  })
}

module.exports = {
  getUsers,
  createUser,
  deleteUser,
}
