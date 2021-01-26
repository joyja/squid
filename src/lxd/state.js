const fetch = require('node-fetch')

const changeContainerState = async function ({
  lxdEndpoint,
  agent,
  containerName,
  action,
}) {
  await fetch(`${lxdEndpoint}/1.0/instaces/${containerName}/state`, {
    method: 'PUT',
    agent,
    body: JSON.stringify({
      action,
      timeout: 30,
      force: false,
    }),
  })
  return fetch(`${lxdEndpoint}/1.0/instances/${containerName}`, {
    agent,
  })
    .then((result) => result.json())
    .then((data) => data.metadata)
}

module.exports = {
  changeContainerState,
}