const http = require('http')
const fetch = require('node-fetch')
const fs = require('fs')
const https = require('https')
const path = require('path')
const express = require('express')
const { ApolloServer, PubSub, gql } = require('apollo-server-express')
const resolvers = require('./resolvers')

const agent = new https.Agent({
  cert: fs.readFileSync(path.resolve('./certificates/lxd.crt'), 'utf-8'),
  key: fs.readFileSync(path.resolve('./certificates/lxd.key'), 'utf-8'),
  rejectUnauthorized: false,
})

const lxdHost = process.env.FACTOTUM_LXD_HOST || 'localhost'
const lxdPort = process.env.FACTOTUM_LXD_PORT || 8443
const lxdEndpoint = `https://${lxdHost}:${lxdPort}`

const app = express()

let httpServer = undefined
let graphqlServer = undefined
let listenHost = process.env.FACTOTUM_HOST || 'localhost'
let listenPort = process.env.FACTOTUM_PORT || 4000

start = async function () {
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
      agent,
      lxdEndpoint,
    }),
    introspection: true,
    playground: true,
  })
  graphqlServer.applyMiddleware({ app, path: '/' })

  httpServer = http.createServer(app)
  graphqlServer.installSubscriptionHandlers(httpServer)

  await new Promise(async (resolve, reject) => {
    httpServer.listen(listenPort, listenHost, async () => {
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
