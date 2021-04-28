const fs = require('fs')
const { exec } = require('child_process')
const logger = require('../logger')

const getUsers = async function () {
  const ignore = [
    '',
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
    'dnsmasq',
    'rtkit',
    'pulse',
    'caddy',
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
  const users = await getUsers()
  if (!users.includes(username)) {
    return new Promise((resolve, reject) => {
      exec(
        `sudo useradd -m -p $(openssl passwd -1 ${password}) -G sudo -s /bin/bash ${username} && sudo -u ${username} mkdir /home/${username}/.ssh && sudo -u ${username} ssh-keygen -f /home/${username}/.ssh/id_rsa -N "" && sudo -u ${username} touch /home/${username}/.ssh/authorized_keys`,
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
  } else {
    const errorMessage = `OS User with username ${username} already exists.`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}

const deleteUser = async function (username) {
  const users = await getUsers()
  if (users.includes(username)) {
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
  } else {
    const errorMessage = `OS User with username ${username} does not exist.`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}

const getAuthorizedKeys = async function (username) {
  const users = await getUsers()
  if (users.includes(username)) {
    return new Promise((resolve, reject) => {
      fs.readFile(
        `/home/${username}/.ssh/authorized_keys`,
        'utf-8',
        (error, data) => {
          if (error) {
            reject(error)
          } else {
            resolve(
              data
                .split(/\r?\n/)
                .map((line, i) => {
                  return {
                    line: i + 1,
                    key: line,
                  }
                })
                .filter((authorizedKey) => {
                  return authorizedKey.key !== ''
                })
            )
          }
        }
      )
    })
  } else {
    const errorMessage = `OS User with username: ${username} does not exist.`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}

const addAuthorizedKey = async function (username, key) {
  const users = await getUsers()
  if (users.includes(username)) {
    return new Promise((resolve, reject) => {
      exec(
        `sudo -u ${username} bash -c 'echo "${key}" >> /home/${username}/.ssh/authorized_keys'`,
        async (err, stdout, stderr) => {
          if (err) {
            reject(err)
          } else if (stderr) {
            reject(stderr)
          } else {
            const authorizedKeys = await getAuthorizedKeys(username)
            resolve(
              authorizedKeys.find((authorizedKey) => {
                return (authorizedKey.key = key)
              })
            )
          }
        }
      )
    })
  } else {
    const errorMessage = `User with username: ${username} does not exist.`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}

const deleteAuthorizedKey = async function (username, line) {
  const users = await getUsers()
  const authorizedKeys = await getAuthorizedKeys(username)
  if (authorizedKeys.length > 0 && authorizedKeys.length <= line) {
    const selectedAuthorizedKey = authorizedKeys.find((authorizedKey) => {
      return (authorizedKey.line = line)
    })
    if (users.includes(username)) {
      return new Promise((resolve, reject) => {
        exec(
          `sudo -u ${username} sed -i '${line}d' /home/${username}/.ssh/authorized_keys`,
          (err, stdout, stderr) => {
            if (err) {
              reject(err)
            } else if (stderr) {
              reject(stderr)
            } else {
              resolve(selectedAuthorizedKey)
            }
          }
        )
      })
    } else {
      const errorMessage = `User with username: ${username} does not exist.`
      logger.error(errorMessage)
      throw new Error(errorMessage)
    }
  } else {
    const errorMessage =
      authorizedKeys.length <= 0
        ? `There are no authorized keys to delete.`
        : `There are only ${authorizedKeys.length} authorized keys for user: ${username} and you requested to delete key number ${line}`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}

module.exports = {
  getUsers,
  createUser,
  deleteUser,
  getAuthorizedKeys,
  addAuthorizedKey,
  deleteAuthorizedKey,
}
