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
  static async delete(selector) {
    if (User.instances > 1) {
      return super.delete(selector)
    } else {
      const errorMessage = `Cannot delete the last user, there must always be at least one.`
      logger.error(errorMessage)
      throw new Error(errorMessage)
    }
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
  static async changeUsername(context, newUsername) {
    const user = await User.getUserFromContext(context)
    const valid = !User.exists({ uername: newUsername })
    if (!valid) {
      const errorMessage =
        user.username === newUsername
          ? 'This is already your username'
          : 'A user already exists with this username'
      logger.error(errorMessage)
      throw new Error(errorMessage)
    } else {
      await user.setUsername(newUsername)
      return user
    }
  }
  static async changePassword(context, newPassword, newPasswordConfirm) {
    const user = await User.getUserFromContext(context)
    const valid = newPassword === newPasswordConfirm
    if (!valid) {
      const errorMessage = 'Password and Password Confirmation do not match.'
      logger.error(errorMessage)
      throw new Error(errorMessage)
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
    return this.update(this.id, `password`, password).then((result) => {
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
