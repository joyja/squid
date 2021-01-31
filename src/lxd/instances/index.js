const { start, stop, restart } = require('./state')
const fetch = require('node-fetch')

const list = async function ({ lxdEndpoint, agent }) {
  const containers = await fetch(`${lxdEndpoint}/1.0/instances`, {
    agent,
  })
    .then((result) => result.json())
    .then((data) => data.metadata)
  return Promise.all(
    containers.map((container) => {
      return fetch(`${lxdEndpoint}${container}`, {
        agent,
      })
        .then((result) => result.json())
        .then((data) => data.metadata)
    })
  )
}

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
    .then((data) => data.metadata)
  await fetch(`${lxdEndpoint}/1.0/operations/${operation.id}/wait`, {
    method: 'GET',
    agent,
  })
  const startOperation = await start({ lxdEndpoint, agent, containerName })
  await fetch(`${lxdEndpoint}/1.0/operations/${startOperation.id}/wait`, {
    method: 'GET',
    agent,
  })
  return fetch(`${lxdEndpoint}/1.0/instances/${containerName}`, {
    agent,
  })
    .then((result) => result.json())
    .then((data) => data.metadata)
}

const drop = async function ({ lxdEndpoint, agent, containerName }) {
  const container = await fetch(
    `${lxdEndpoint}/1.0/instances/${containerName}`,
    {
      method: 'GET',
      agent,
    }
  )
    .then((result) => result.json())
    .then((data) => data.metadata)
  const stopOperation = await stop({ lxdEndpoint, agent, containerName })
  await fetch(`${lxdEndpoint}/1.0/operations/${stopOperation.id}/wait`, {
    method: 'GET',
    agent,
  })
  const operation = await fetch(
    `${lxdEndpoint}/1.0/instances/${containerName}`,
    {
      method: 'DELETE',
      agent,
    }
  )
  await fetch(`${lxdEndpoint}/1.0/operations/${operation.id}/wait`, {
    method: 'GET',
    agent,
  })
  return container
}

module.exports = {
  list,
  create,
  drop,
  start,
  stop,
  restart,
}
