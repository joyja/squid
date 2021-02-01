const fetch = require('node-fetch')
const yaml = require('js-yaml')
const path = require('path')
const fs = require('fs')

const list = async function ({ lxdEndpoint, agent }) {
  return fetch(`${lxdEndpoint}/1.0/profiles`, {
    method: 'GET',
    agent,
  })
    .then((result) => result.json())
    .then((data) => data.metadata)
}

const create = async function ({ lxdEndpoint, agent, config }) {
  return fetch(`${lxdEndpoint}/1.0/profiles`, {
    method: 'POST',
    agent,
    body: JSON.stringify(config),
  })
    .then((result) => result.json())
    .then((data) => data.metadata)
}

const update = async function ({ lxdEndpoint, agent, config }) {
  return fetch(`${lxdEndpoint}/1.0/profiles/${config.name}`, {
    method: 'PUT',
    agent,
    body: JSON.stringify(config),
  })
    .then((result) => result.json())
    .then((data) => data.metadata)
}

const get = async function ({ lxdEndpoint, agent, profileName }) {
  return await fetch(`${lxdEndpoint}/1.0/profiles/${profileName}`, {
    method: 'GET',
    agent,
  })
    .then((result) => result.json())
    .then((data) => data.metadata)
}

const initializeDefaultProfile = function ({
  lxdEndpoint,
  agent,
  profileName,
  action,
}) {
  const filePath = path.resolve(`./src/profiles/${profileName}.yaml`)
  const fileContents = fs.readFileSync(filePath, 'utf-8')
  const config = yaml.load(fileContents)
  if (action === 'create') {
    return create({ lxdEndpoint, agent, config })
  } else if (action === 'update') {
    return update({ lxdEndpoint, agent, config })
  } else {
    throw Error(
      `${action} is not a valid action, only create and update are allowed actions for initializing default profiles.`
    )
  }
}

const initializeDefaultProfiles = async function ({ lxdEndpoint, agent }) {
  const defaultProfileNames = ['tentacle', 'node-red', 'ignition', 'postgres']
  const existingProfiles = await list({ lxdEndpoint, agent })
  console.log(existingProfiles)
  for (profileName of defaultProfileNames) {
    if (existingProfiles.some((profile) => profile.includes(profileName))) {
      await initializeDefaultProfile({
        lxdEndpoint,
        agent,
        profileName,
        action: 'update',
      })
    } else {
      await initializeDefaultProfile({
        lxdEndpoint,
        agent,
        profileName,
        action: 'create',
      })
    }
  }
}

module.exports = {
  initializeDefaultProfiles,
}
