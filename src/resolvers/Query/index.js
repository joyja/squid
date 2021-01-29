const fetch = require('node-fetch')
const { network } = require('../../os')
const lxd = require('../../lxd')

const containers = async function (
  root,
  args,
  { lxdEndpoint, agent, cloudInitComplete },
  info
) {
  return lxd.instances.list({ lxdEndpoint, agent }).then((containers) => {
    return containers.map((container) => {
      return {
        ...container,
        cloudInitComplete: cloudInitComplete[container.name],
      }
    })
  })
}

const profiles = async function (root, args, { lxdEndpoint, agent }, info) {
  return fetch(`${lxdEndpoint}/1.0/profiles`, {
    agent,
  }).then((result) => {
    return result.json().then((data) => {
      return Promise.all(
        data.metadata.map((profile) => {
          return fetch(`${lxdEndpoint}${profile}`, {
            agent,
          }).then((result) => {
            return result.json().then((data) => data.metadata)
          })
        })
      )
    })
  })
}

const operations = async function (root, args, { lxdEndpoint, agent }, info) {
  const result = await lxd.operations.list({ lxdEndpoint, agent })
  console.log(result)
  return result
}

const networkInterfaces = async function (root, args, context, info) {
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
  containers,
  profiles,
  operations,
  networkInterfaces,
  networkInterfaceConfigs,
}
