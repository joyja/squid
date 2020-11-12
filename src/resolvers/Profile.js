const devices = function (parent, args, context, info) {
  if (parent.devices) {
    return Object.keys(parent.devices).map((key) => {
      return {
        id: key,
        ...parent.devices[key],
      }
    })
  } else {
    return []
  }
}

module.exports = {
  devices,
}
