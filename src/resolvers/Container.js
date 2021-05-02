const fetch = require('node-fetch')
const { getCloudInitStatus } = require('../lxd old/cloud-init')

const profiles = async function (parent, args, { lxd }, info) {
  return Promise.all(parent.profiles.map((p) => lxd.profiles.get(p)))
}

const network = async function (parent, args, { lxd }, info) {
  const { network } = await lxd.instances.state(parent.name)
  if (network) {
    return Object.keys(network)
      .map((key) => {
        return {
          name: key,
          ...network[key],
          macAddress: network[key].hwaddr,
          addresses: network[key].addresses.filter((address) => {
            return address.family !== 'inet6'
          }),
          ...network[key].counters,
        }
      })
      .filter((network) => {
        return network.addresses.length > 0 && network.type !== 'loopback'
      })
  } else {
    return []
  }
}

const cloudInitComplete = function (parent, args, { lxd }, info) {
  return lxd.instances
    .getCloudInitStatus(parent.name)
    .then((result) => {
      return result.includes('done')
    })
    .catch(() => {
      return true
    })
}

const application = async function (parent, args, { lxd }, info) {
  const profilesResult = await profiles(parent, args, { lxd }, info)
  const applications = [
    'grafana',
    'ignition',
    'codesys',
    'mosquitto',
    'nginx',
    'node-red',
    'postgres',
    'tentacle',
  ]
  return (
    applications.find((application) => {
      return profilesResult.some((p) => p.name === application)
    }) || 'Uknown'
  )
}

module.exports = {
  profiles,
  network,
  cloudInitComplete,
  application,
}
