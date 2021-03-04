const fs = require('fs')
const { exec } = require('child_process')
const auth = require('./auth')
const logger = require('../logger')

const getAuthorizedKeys = async function (username) {
  const users = await auth.getUsers()
  if (!users.includes(username)) {
    return new Promise((resolve, reject) => {
      fs.readFile(`/${username}/.ssh/authorized_keys`, (error, data) => {
        if (error) {
          reject(error)
        } else {
          resolve(data.split(/\r?\n/))
        }
      })
    })
  } else {
    const errorMessage = `User with username: ${username} does not exist.`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}

const addAuthorizedKey = async function (username, key) {
  const users = await auth.getUsers()
  if (!users.includes(username)) {
    return Promise((resolve, reject) => {
      exec(
        `echo "${key}" >> /${username}/.ssh/authorized_keys`,
        (err, stdout, stderr) => {
          if (err) console.error(err)
          if (stderr) console.error(stderr)
        }
      )
    })
  } else {
    const errorMessage = `User with username: ${username} does not exist.`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}

const deleteAuthorizedKey = async function (line) {
  const users = await auth.getUsers()
  if (!users.includes(username)) {
    exec(`sed -i '${line}d' ./file`, (err, stdout, stderr) => {
      if (err) console.error(err)
      if (stderr) console.error(stderr)
    })
  } else {
    const errorMessage = `User with username: ${username} does not exist.`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}

module.exports = {
  getAuthorizedKeys,
  addAuthorizedKey,
  deleteAuthorizedKey,
}
