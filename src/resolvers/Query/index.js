const fetch = require('node-fetch')

const containers = async function (root, args, context, info) {
  const result = await fetch(`${context.lxdEndpoint}/1.0/instances`, {
    agent: context.agent,
  })
  const { metadata: containers } = await result.json()
  const requestPromises = containers.map((container) => {
    return fetch(`${context.lxdEndpoint}${container}`, {
      agent: context.agent,
    })
  })
  const containerResponses = await Promise.all(requestPromises)
  const containerDataPromises = containerResponses.map((r) => r.json())
  const containerData = await Promise.all(containerDataPromises)
  return containerData.map((d) => d.metadata)
}

module.exports = {
  info: () => `IIOT application container manger.`,
  containers,
}
