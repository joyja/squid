const fetch = require('node-fetch')

const setDescription = async function (
  root,
  args,
  { lxdEndpoint, agent },
  info
) {
  await fetch(`${lxdEndpoint}/1.0/instances/${args.containerName}`, {
    method: 'PATCH',
    agent,
    body: JSON.stringify({
      description: args.description,
    }),
  })
  return fetch(`${lxdEndpoint}/1.0/instances/${args.containerName}`, {
    agent,
  })
    .then((result) => result.json())
    .then((data) => data.metadata)
}

module.exports = {
  setDescription,
}
