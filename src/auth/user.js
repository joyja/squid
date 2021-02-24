const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Model } = require('../database')
const { v1: uuidv1 } = require('uuid')
const logger = require('../logger')
const { AuthenticationError } = require('apollo-server-express')

const APP_SECRET =
  process.env.NODE_ENV === 'development' ? 'development_secret' : uuidv1()

class User extends Model {
  static async initialize(db, pubsub) {
    const result = await super.initialize(db, pubsub)
    const rootUser = User.instances.find((user) => {
      return user.username === `admin`
    })
    if (!rootUser) {
      await User.create(`admin`, `password`)
    }
    return result
  }
  static async create(username, password) {
    const hash = await bcrypt.hash(password, 10)
    const fields = {
      username,
      password: hash,
    }
    return super.create(fields)
  }
  static async login(username, password) {
    const user = User.instances.find((user) => {
      return user.username === username
    })
    const errorMessage = 'The username or password is incorrect.'
    if (user) {
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) {
        logger.error(errorMessage)
        throw new AuthenticationError(errorMessage)
      } else {
        const token = jwt.sign(
          {
            userId: user.id,
          },
          APP_SECRET
        )
        return {
          token,
          user,
        }
      }
    } else {
      logger.error(errorMessage)
      throw new AuthenticationError(errorMessage)
    }
  }
  static async getUserFromContext(context) {
    const secret = APP_SECRET
    const errorMessage = `You are not authorized.`
    const authorization = context.req
      ? context.req.headers.authorization
      : context.connection.context.Authorization
    if (authorization) {
      const token = authorization.replace('Bearer ', '')
      try {
        const { userId } = jwt.verify(token, secret)
        return User.get(userId)
      } catch (error) {
        logger.error(errorMessage)
        throw new AuthenticationError(errorMessage)
      }
    } else {
      logger.error(errorMessage)
      throw new AuthenticationError(errorMessage)
    }
  }
  static async changePassword(context, oldPassword, newPassword) {
    const user = await User.getUserFromContext(context)
    const valid = await bcrypt.compare(oldPassword, user.password)
    if (!valid) {
      throw new Error('Invalid old password.')
    } else {
      await user.setPassword(newPassword)
      return user
    }
  }
  async init() {
    const result = await super.init()
    this._username = result.username
    this._password = result.password
  }
  async setPassword(newValue) {
    const password = await bcrypt.hash(newValue, 10)
    return this.update(this.id, `password`, password, User).then((result) => {
      this._password = password
    })
  }
}
User.table = `user`
User.fields = [
  { colName: 'username', colType: 'TEXT' },
  { colName: 'password', colType: 'TEXT' },
]
User.instances = []
User.initialized = false

module.exports = {
  User,
}
