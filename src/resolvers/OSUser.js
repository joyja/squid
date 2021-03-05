const os = require('../os')

const authorizedKeys = function (parent, args, context, info) {
  return os.auth.getAuthorizedKeys(parent.username)
}

module.exports = {
  authorizedKeys,
}
