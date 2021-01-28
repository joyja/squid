const fetch = require('node-fetch')
const { network } = require('../../os')
const lxd = require('../../lxd')

const createContainer = async function (
  root,
  args,
  { lxdEndpoint, agent },
  info
) {
  return lxd.instances.create({
    lxdEndpoint,
    agent,
    containerName: args.containerName,
    profile: args.profile,
  })
}

const startContainer = async function (
  root,
  args,
  { lxdEndpoint, agent },
  info
) {
  return lxd.instances.start({
    lxdEndpoint,
    agent,
    containerName: args.containerName,
  })
}

const stopContainer = async function (
  root,
  args,
  { lxdEndpoint, agent },
  info
) {
  return lxd.instances.stop({
    lxdEndpoint,
    agent,
    containerName: args.containerName,
  })
}

const restartContainer = async function (
  root,
  args,
  { lxdEndpoint, agent },
  info
) {
  return lxd.instances.restart({
    lxdEndpoint,
    agent,
    containerName: args.containerName,
  })
}

const setDescription = async function (
  root,
  args,
  { lxdEndpoint, agent },
  info
) {
  await fetch(`${lxdEndpoint}/1.0/instances/${args.containerName}`, {
    method: 'PATCH',
    agent,
    body: JSON.stringify({
      description: args.description,
    }),
  })
  return fetch(`${lxdEndpoint}/1.0/instances/${args.containerName}`, {
    agent,
  })
    .then((result) => result.json())
    .then((data) => data.metadata)
}

const createProfile = async function (
  root,
  args,
  { lxdEndpoint, agent },
  info
) {
  await fetch(`${lxdEndpoint}/1.0/profiles`, {
    method: 'POST',
    agent,
    body: JSON.stringify({
      name: args.name,
      description: args.description,
      configs: {
        userData: args.userData,
      },
    }),
  })
}

const setInterfaceConfig = async function (root, args, context, info) {
  const config = {
    name: args.name,
    dhcp4: args.dhcp,
    addresses: args.addresses,
    gateway4: args.gateway,
  }
  network.setInterfaceConfig(config)
  await new Promise((resolve) => setTimeout(() => resolve(), 2000))
  const ifaces = await network.getInterfaces()
  const defaultRoutes = await network.getDefaultRoutes()
  const iface = ifaces.find((iface) => iface.name === args.name)
  const defaultRoute = defaultRoutes.find(
    (route) => route.interface === iface.name
  )
  return {
    ...iface,
    gateway: defaultRoute ? defaultRoute.gateway : null,
  }
}

module.exports = {
  createContainer,
  startContainer,
  stopContainer,
  restartContainer,
  setDescription,
  setInterfaceConfig,
}
