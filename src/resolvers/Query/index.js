const fetch = require('node-fetch')
const { network, auth } = require('../../os')
const { User } = require('../../auth')

async function user(root, args, context, info) {
  return User.getUserFromContext(context)
}

async function users(root, args, context, info) {
  await User.getUserFromContext(context)
  return User.instances
}

// OS Queries

async function osUsers(root, args, context, info) {
  await User.getUserFromContext(context)
  return auth.getUsers().then((result) => {
    return result.map((username) => {
      return {
        username,
      }
    })
  })
}

//Container Queries

const containers = async function (root, args, context, info) {
  const { lxd } = context
  await User.getUserFromContext(context)
  const result = await lxd.instances.list({ lxd })
  console.log(result)
  return result
}

const profiles = async function (root, args, context, info) {
  const { lxd } = context
  await User.getUserFromContext(context)
  return lxd.profiles.list()
}

const operations = async function (root, args, context, info) {
  const { lxd } = context
  await User.getUserFromContext(context)
  const result = await lxd.operations.list({ lxd })
  return result
}

const networkInterfaces = async function (root, args, context, info) {
  await User.getUserFromContext(context)
  const ifaces = await network.getInterfaces()
  const defaultRoutes = await network.getDefaultRoutes()
  return ifaces.map((iface) => {
    const defaultRoute = defaultRoutes.find(
      (route) => route.interface === iface.name
    )
    return {
      ...iface,
      gateway: defaultRoute ? defaultRoute.gateway : null,
    }
  })
}

const networkInterfaceConfigs = async function (root, args, context, info) {
  await User.getUserFromContext(context)
  const config = network.getConfig()[0]
  const result = Object.keys(config.contents.network.ethernets).map((key) => {
    return {
      name: key,
      ...config.contents.network.ethernets[key],
      addresses: config.contents.network.ethernets[key].addresses || [],
    }
  })
  return result
}

module.exports = {
  info: () => `IIOT application container manger.`,
  user,
  users,
  osUsers,
  containers,
  profiles,
  operations,
  networkInterfaces,
  networkInterfaceConfigs,
}
