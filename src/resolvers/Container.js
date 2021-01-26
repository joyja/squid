const fetch = require('node-fetch')

const profiles = async function (parent, args, { lxdEndpoint, agent }, info) {
  const responses = await Promise.all(
    parent.profiles.map((p) =>
      fetch(`${lxdEndpoint}/1.0/profiles/${p}`, { agent: agent })
    )
  )
  const profiles = await Promise.all(responses.map((r) => r.json()))
  return profiles.map((p) => p.metadata)
}

const network = async function (parent, args, { lxdEndpoint, agent }, info) {
  const {
    metadata: { network },
  } = await fetch(`${lxdEndpoint}/1.0/instances/${parent.name}/state`, {
    agent: agent,
  }).then((r) => {
    return r.json()
  })
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

module.exports = {
  profiles,
  network,
}
