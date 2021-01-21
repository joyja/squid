const fs = require('fs')

const getAuthorizedKeys = async function () {
  return new Promise((resolve, reject) => {
    fs.readFile('/ubuntu/.ssh/authorized_keys', (error, data) => {
      if (error) {
        reject(error)
      } else {
        resolve(data.split(/\r?\n/))
      }
    })
  })
}

module.exports = {
  getAuthorizedKeys,
}
