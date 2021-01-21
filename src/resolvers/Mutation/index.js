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

const createProfile = async function (
  root,
  args,
  { lxdEndpoint, agent },
  info
) {
  await fetch(`${lxdEndpoint}/1.0/profiles`, {
    method: 'POST',
    agent,
    body: JSON.stringify({
      name: args.name,
      description: args.description,
      configs: {
        userData: args.userData,
      },
    }),
  })
}

module.exports = {
  setDescription,
}
