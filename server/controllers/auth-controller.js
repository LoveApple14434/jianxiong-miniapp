const config = require('../config')
const { exchangeCodeForSession } = require('../utils/wechat')
const { signToken } = require('../utils/token')
const { upsertByOpenid, toPublicUser } = require('../models/user-store')

const durationToMilliseconds = seconds => seconds * 1000

const login = async (req, res) => {
  try {
    const { code, clientId = '', profile = {} } = req.body || {}

    console.log('[auth/login] incoming payload:', {
      code: code ? '[present]' : '[missing]',
      clientId,
      profile: {
        nickName: profile.nickName,
        nickname: profile.nickname,
        avatarText: profile.nickName || profile.nickname ? String(profile.nickName || profile.nickname).charAt(0) : '健',
        gender: profile.gender,
        country: profile.country,
        province: profile.province,
        city: profile.city,
        language: profile.language
      }
    })

    if (!code) {
      return res.status(400).json({ code: 400, message: '缺少登录凭证' })
    }

    const session = await exchangeCodeForSession({ code, clientId, profile })
    const user = await upsertByOpenid({
      openid: session.openid,
      clientId,
      profile,
      session
    })
    const publicUser = toPublicUser(user)

    console.log('[auth/login] resolved user:', {
      openid: session.openid,
      nickName: publicUser.nickName,
      avatarText: publicUser.avatarText,
      previousLoginAt: publicUser.previousLoginAt,
      loginCount: publicUser.loginCount,
      sessionType: session.mock ? 'mock' : 'wechat'
    })

    const token = signToken({ uid: publicUser.id, openid: session.openid })

    return res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        expiresAt: Date.now() + durationToMilliseconds(config.tokenExpiresInSeconds),
        user: publicUser,
        sessionType: session.mock ? 'mock' : 'wechat'
      }
    })
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message || '登录失败' })
  }
}

const me = async (req, res) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ code: 401, message: '未登录或登录已过期' })
    }

    return res.json({
      code: 0,
      message: 'ok',
      data: {
        token: req.auth.token,
        user: req.auth.user,
        expiresAt: Date.now() + durationToMilliseconds(config.tokenExpiresInSeconds)
      }
    })
  } catch (error) {
    return res.status(500).json({ code: 500, message: error.message || '获取用户信息失败' })
  }
}

const logout = async (req, res) => {
  return res.json({
    code: 0,
    message: '已退出登录',
    data: {
      success: true
    }
  })
}

module.exports = {
  login,
  me,
  logout
}