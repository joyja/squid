const { start, stop, restart } = require('./state')
const fetch = require('node-fetch')
const logger = require('../../logger')

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
  logger.info(`Creating ${containerName} container.`)
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
        protocol: 'simplestreams',
        mode: 'pull',
        server: 'ubuntu',
        alias: 'ubuntu:focal',
      },
    }),
  })
    .then((result) => result.json())
    .then(({ error, metadata }) => {
      if (error) {
        logger.error(error)
        throw new Error(error)
      }
      return metadata
    })
  logger.info(
    `Waiting for operation ${operation.id} to create ${containerName}.`
  )
  await fetch(`${lxdEndpoint}/1.0/operations/${operation.id}/wait`, {
    method: 'GET',
    agent,
  })
  logger.info(`Starting container ${containerName}.`)
  const startOperation = await start({ lxdEndpoint, agent, containerName })
  logger.info(
    `Waiting for operation ${startOperation.id} to create ${containerName}.`
  )
  await fetch(`${lxdEndpoint}/1.0/operations/${startOperation.id}/wait`, {
    method: 'GET',
    agent,
  })
  logger.info(`Container ${containerName} started.`)
  return fetch(`${lxdEndpoint}/1.0/instances/${containerName}`, {
    agent,
  })
    .then((result) => result.json())
    .then((data) => data.metadata)
}

const drop = async function ({ lxdEndpoint, agent, containerName }) {
  const container = await stop({ lxdEndpoint, agent, containerName })
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
