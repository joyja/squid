const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const https = require('https')
const yaml = require('js-yaml')

class Profiles {
  constructor(lxd) {
    this.lxd = lxd
    this.defaultNames = [
      'tentacle',
      'node-red',
      'ignition',
      'postgres',
      'grafana',
      'codesys',
      'mosquitto',
    ]
  }
  async init() {
    const existingProfiles = await this.list()
    for (const profileName of this.defaultNames) {
      const filePath = path.resolve(`./src/profiles/${profileName}.yaml`)
      const fileContents = fs.readFileSync(filePath, 'utf-8')
      const config = yaml.load(fileContents)
      if (existingProfiles.some((profile) => profile.includes(profileName))) {
        return this.update(config)
      } else {
        return this.create(config)
      }
    }
  }
  async get(name) {
    return this.lxd.get(`/1.0/profiles/${name}`)
  }
  async list() {
    const endpoints = await this.lxd.get('/1.0/profiles')
    return Promise.all(
      endpoints.map((endpoint) => {
        return this.lxd.get(endpoint)
      })
    )
  }
  async create(config) {
    const body = JSON.stringify(config)
    return this.lxd.post('/1.0/profiles', body)
  }
  async update(config) {
    const body = JSON.stringify(config)
    return this.lxd.put(`/1.0/profiles/${config.name}`, body)
  }
}

class Operations {
  constructor(lxd) {
    this.lxd = lxd
  }
  async wait(id) {
    return this.lxd.get(`/1.0/operations/${id}/wait`)
  }
}

class Instances {
  constructor(lxd) {
    this.lxd = lxd
  }
  getCloudInitOutputLog(containerName) {
    return new Promise((resolve, reject) => {
      exec(
        `lxc exec ${containerName} -- cat /var/log/cloud-init-output.log`,
        (err, stdout, stderr) => {
          if (err) {
            reject(err)
          } else if (stderr) {
            reject(stderr)
          } else {
            resolve(stdout)
          }
        }
      )
    })
  }
  getCloudInitStatus(containerName) {
    return new Promise((resolve, reject) => {
      exec(
        `lxc exec ${containerName} -- cloud-init status`,
        (err, stdout, stderr) => {
          if (err) {
            reject(err)
          } else if (stderr) {
            reject(stderr)
          } else {
            resolve(stdout.replace('status: ', ''))
          }
        }
      )
    })
  }
  async list() {
    const endpoints = await this.lxd.get('/1.0/instances')
    return Promise.all(
      endpoints.map((endpoint) => {
        return this.lxd.get(endpoint)
      })
    )
  }
  async get(name) {
    return this.lxd.get(`/1.0/instances/${name}`)
  }
  async create({ name, profile }) {
    const body = JSON.stringify({
      name,
      architecture: 'x86_64',
      profiles: ['default', 'macvlan', profile],
      ephemeral: false,
      type: 'container',
      source: {
        type: 'image',
        protocol: 'simplestreams',
        server: 'https://cloud-images.ubuntu.com/releases',
        alias: 'focal',
      },
    })
    return this.lxd.post('/1.0/instances', body)
  }
  async setState({ name, action }) {
    const body = JSON.stringify({
      action,
      timeout: 30,
      force: false,
    })
    return this.lxd.put(`/1.0/instances/${name}/state`, body)
  }
  async state(name) {
    return this.lxd.get(`/1.0/instances/${name}/state`)
  }
  async start(name) {
    return this.setState({ name, action: 'start' })
  }
  async stop(name) {
    return this.setState({ name, action: 'stop' })
  }
  async restart(name) {
    return this.setState({ name, action: 'restart' })
  }
  async delete(name) {
    return this.lxd.delete(`/1.0/containers/${name}`)
  }
}

class LXD {
  constructor(pubsub) {
    this.pubsub = pubsub
    this.agent = new https.Agent({
      cert: fs.readFileSync(path.resolve('./certificates/lxd.crt'), 'utf-8'),
      key: fs.readFileSync(path.resolve('./certificates/lxd.key'), 'utf-8'),
      rejectUnauthorized: false,
    })
    this.host = process.env.SQUID_LXD_HOST || 'localhost'
    this.port = process.env.SQUID_LXD_PORT || 8443
    this.url = `https://${this.host}:${this.port}`
    this.instances = new Instances(this)
    this.operations = new Operations(this)
    this.profiles = new Profiles(this)
  }
  async init() {
    await this.profiles.init()
  }
  async fetch({ method, endpoint, body }) {
    return await fetch(`${this.url}${endpoint}`, {
      method,
      agent: this.agent,
      body,
    })
      .then((result) => result.json())
      .then((data) => data.metadata)
  }
  async get(endpoint) {
    return this.fetch({ method: 'GET', endpoint })
  }
  async post(endpoint, body) {
    return this.fetch({ method: 'POST', endpoint, body })
  }
  async patch(endpoint, body) {
    return this.fetch({ method: 'PATCH', endpoint, body })
  }
  async put(endpoint, body) {
    return this.fetch({ method: 'PUT', endpoint, body })
  }
  async delete(endpoint) {
    return this.fetch({ method: 'DELETE', endpoint })
  }
}

module.exports = LXD
