const http = require('http')
const fetch = require('node-fetch')
const fs = require('fs')
const https = require('https')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const express = require('express')
const { ApolloServer, PubSub, gql } = require('apollo-server-express')
const resolvers = require('./resolvers')
const lxd = require('./lxd')
const { User } = require('./auth')
const { executeQuery } = require('./database')

const desiredUserVersion = 1

const agent = new https.Agent({
  cert: fs.readFileSync(path.resolve('./certificates/lxd.crt'), 'utf-8'),
  key: fs.readFileSync(path.resolve('./certificates/lxd.key'), 'utf-8'),
  rejectUnauthorized: false,
})

const lxdHost = process.env.FACTOTUM_LXD_HOST || 'localhost'
const lxdPort = process.env.FACTOTUM_LXD_PORT || 8443
const lxdEndpoint = `https://${lxdHost}:${lxdPort}`

const app = express()

app.use(express.json())

let db = undefined
let httpServer = undefined
let graphqlServer = undefined
let listenHost = process.env.FACTOTUM_HOST || 'localhost'
let listenPort = process.env.FACTOTUM_PORT || 4000

start = async function (dbFilename) {
  const dir = './database'

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  let fileExisted = false
  // Create database
  if (dbFilename === `:memory`) {
    db = new sqlite3.Database(`:memory`, (error) => {
      if (error) {
        throw error
      }
    })
  } else {
    if (fs.existsSync(`${dir}/${dbFilename}.db`)) {
      fileExisted = false
    }
    db = new sqlite3.cached.Database(`${dir}/${dbFilename}.db`, (error) => {
      if (error) {
        throw error
      }
    })
  }

  //Initialize default profiles in LXD
  await lxd.profiles.initializeDefaultProfiles({ lxdEndpoint, agent })
  //populate cloudInitComplete object, to be used for creation status
  const containers = await lxd.instances.list({ lxdEndpoint, agent })
  const cloudInitComplete = {}
  containers.forEach((container) => {
    cloudInitComplete[container.name] = true
  })
  app.post('/phone-home/:instanceId', async (req, res, next) => {
    if (cloudInitComplete[req.params.instanceId] !== undefined) {
      cloudInitComplete[req.params.instanceId] = true
      res.sendStatus(200)
    } else {
      res.status(400).send({ message: 'Container not found.' })
    }
  })
  const pubsub = new PubSub()
  graphqlServer = new ApolloServer({
    typeDefs: gql`
      ${fs.readFileSync(__dirname.concat('/schema.graphql'), 'utf8')}
    `,
    resolvers,
    subscriptions: {
      path: '/',
    },
    context: (req) => ({
      ...req,
      requests: req,
      pubsub,
      db,
      agent,
      lxdEndpoint,
      cloudInitComplete,
      users: User.instances,
    }),
    introspection: true,
    playground: true,
  })
  graphqlServer.applyMiddleware({ app, path: '/' })

  httpServer = http.createServer(app)
  graphqlServer.installSubscriptionHandlers(httpServer)

  await new Promise(async (resolve, reject) => {
    httpServer.listen(listenPort, listenHost, async () => {
      const context = graphqlServer.context()
      await executeQuery(context.db, 'PRAGMA foreign_keys = ON', [], true)
      const { user_version: userVersion } = await executeQuery(
        context.db,
        'PRAGMA user_version',
        [],
        true
      )
      if (
        dbFilename !== ':memory:' &&
        fileExisted &&
        userVersion !== desiredUserVersion
      ) {
        fs.copyFileSync(
          `${dir}/${dbFilename}.db`,
          `${dir}/${dbFilename}-backup-${new Date().toISOString()}.db`
        )
      }
      await User.initialize(context.db, context.pubsub)
      await context.db.get(`PRAGMA user_version = ${desiredUserVersion}`)
      resolve()
    })
  })
  process.on('SIGINT', async () => {
    await stop()
  })
}

stop = async function () {
  httpServer.close()
}

module.exports = { start, stop }
