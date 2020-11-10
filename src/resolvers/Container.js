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

module.exports = {
  profiles,
}
