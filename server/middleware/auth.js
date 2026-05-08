const { verifyToken } = require('../utils/token')
const { findByOpenid, toPublicUser } = require('../models/user-store')

const extractToken = req => {
  const authHeader = req.headers.authorization || ''

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  return req.body && req.body.token ? req.body.token : req.query.token || ''
}

const authRequired = async (req, res, next) => {
  try {
    const token = extractToken(req)

    if (!token) {
      return res.status(401).json({ code: 401, message: '未登录或登录已过期' })
    }

    const decoded = verifyToken(token)
    const user = await findByOpenid(decoded.openid)

    if (!user) {
      return res.status(401).json({ code: 401, message: '未登录或登录已过期' })
    }

    req.auth = {
      token,
      decoded,
      user: toPublicUser(user)
    }

    next()
  } catch (error) {
    return res.status(401).json({ code: 401, message: '未登录或登录已过期' })
  }
}

module.exports = {
  authRequired
}