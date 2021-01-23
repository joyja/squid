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
  return Object.keys(network).map((key) => {
    return {
      name: key,
      ...network[key],
      addresses: network[key].addresses.filter((address) => {
        return address.family !== 'inet6'
      }),
      ...network[key].counters,
    }
  })
}

module.exports = {
  profiles,
  network,
}
