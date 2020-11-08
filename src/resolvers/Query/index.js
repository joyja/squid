const fetch = require('node-fetch')
const fs = require('fs')
const https = require('https')
const path = require('path')

const agent = new https.Agent({
  cert: fs.readFileSync(path.resolve('./certificates/lxd.crt'), 'utf-8'),
  key: fs.readFileSync(path.resolve('./certificates/lxd.key'), 'utf-8'),
  rejectUnauthorized: false,
})

const getContainers = async function (root, args, context, info) {
  const result = await fetch(
    'https://jar1.internal1.jarautomation.io:8443/1.0/instances',
    {
      agent,
    }
  )
  const { metadata: containers } = await result.json()
  const requestPromises = containers.map((container) => {
    return fetch(`https://jar1.internal1.jarautomation.io:8443${container}`, {
      agent,
    })
  })
  const containerResponses = await Promise.all(requestPromises)
  const containerDataPromises = containerResponses.map((r) => r.json())
  const containerData = await Promise.all(containerDataPromises)
  return containerData.map((d) => d.metadata)
}

module.exports = {
  info: () => `IIOT application container manger.`,
  getContainers,
}
