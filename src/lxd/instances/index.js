const { start, stop, restart } = require('./state')

const create = async function ({ lxdEndpoint, agent, containerName, profile }) {
  const result = await fetch(`${lxdEndpoint}/1.0/instances`, {
    method: 'POST',
    agent,
    body: JSON.stringify({
      name: containerName,
      architecture: 'x86_64',
      profiles: ['default', 'macvlan', profile],
      ephemeral: false,
      type: 'container',
      source: {
        os: 'ubuntu',
        release: '20.04',
        architecture: 'x86_64',
      },
    }),
  })
}

module.exports = {
  create,
  start,
  stop,
  restart,
}
