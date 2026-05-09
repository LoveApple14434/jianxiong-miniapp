const jwt = require('jsonwebtoken')

const config = require('../config')

const signToken = payload => jwt.sign(payload, config.jwtSecret, { expiresIn: config.tokenExpiresIn })

const verifyToken = token => jwt.verify(token, config.jwtSecret)

module.exports = {
  signToken,
  verifyToken
}