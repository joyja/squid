const fetch = require('node-fetch')

const containers = async function (root, args, { lxdEndpoint, agent }, info) {
  const result = await fetch(`${lxdEndpoint}/1.0/instances`, {
    agent,
  })
  const { metadata: containers } = await result.json()
  const requestPromises = containers.map((container) => {
    return fetch(`${lxdEndpoint}${container}`, {
      agent,
    })
  })
  const containerResponses = await Promise.all(requestPromises)
  const containerDataPromises = containerResponses.map((r) => r.json())
  const containerData = await Promise.all(containerDataPromises)
  return containerData.map((d) => d.metadata)
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

module.exports = {
  info: () => `IIOT application container manger.`,
  containers,
  profiles,
}
