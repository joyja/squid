const fetch = require('node-fetch')

const list = async function ({ lxdEndpoint, agent }) {
  const operationUrls = await fetch(`${lxdEndpoint}/1.0/operations`, {
    method: 'GET',
    agent,
  })
    .then((result) => result.json())
    .then((data) => data.metadata.success || [])
  return Promise.all(
    operationUrls.map((operationUrl) => {
      return fetch(`${lxdEndpoint}${operationUrl}`, {
        method: 'GET',
        agent,
      })
        .then((result) => result.json())
        .then((data) => data.metadata)
    })
  )
}

module.exports = {
  list,
}
