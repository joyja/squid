const { start, stop, restart } = require('./state')
const fetch = require('node-fetch')

const create = async function ({ lxdEndpoint, agent, containerName, profile }) {
  const operation = await fetch(`${lxdEndpoint}/1.0/instances`, {
    method: 'POST',
    agent,
    body: JSON.stringify({
      name: containerName,
      architecture: 'x86_64',
      profiles: ['default', 'macvlan', profile],
      ephemeral: false,
      type: 'container',
      source: {
        type: 'image',
        properties: {
          os: 'ubuntu',
          release: 'focal',
        },
      },
    }),
  })
    .then((result) => result.json())
    .then((data) => {
      console.log(data)
      return data.metadata
    })
  console.log(operation)
  await fetch(`${lxdEndpoint}/1.0/operations/${operation.id}/wait`, {
    method: 'GET',
    agent,
  })
  return fetch(`${lxdEndpoint}/1.0/instances/${containerName}`, {
    agent,
  })
    .then((result) => result.json())
    .then((data) => data.metadata)
}

module.exports = {
  create,
  start,
  stop,
  restart,
}
