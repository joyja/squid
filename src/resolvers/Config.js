const securityNesting = function (parent, args, context, info) {
  return parent['security.nesting'] === null ||
    parent['security.nesting'] === undefined
    ? null
    : parent['security.nesting'] + '' === 'true'
}

const userUserData = function (parent, args, context, info) {
  return parent['user.user-data']
}

module.exports = {
  securityNesting,
  userUserData,
}
