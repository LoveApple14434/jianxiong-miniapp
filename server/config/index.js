require('dotenv').config()

const parseDurationToSeconds = value => {
  if (!value) {
    return 7 * 24 * 60 * 60
  }

  if (/^\d+$/.test(value)) {
    return Number(value)
  }

  const match = String(value).trim().match(/^(\d+)(ms|s|m|h|d)$/i)

  if (!match) {
    return 7 * 24 * 60 * 60
  }

  const amount = Number(match[1])
  const unit = match[2].toLowerCase()
  const unitMap = {
    ms: 1 / 1000,
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60
  }

  return Math.max(1, Math.floor(amount * (unitMap[unit] || 1)))
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'jianxiong-miniapp-login-secret',
  wechatAppId: process.env.WECHAT_APP_ID || '',
  wechatAppSecret: process.env.WECHAT_APP_SECRET || '',
  tokenExpiresIn: process.env.TOKEN_EXPIRES_IN || '7d',
  tokenExpiresInSeconds: parseDurationToSeconds(process.env.TOKEN_EXPIRES_IN || '7d'),
  mockLogin: String(process.env.MOCK_LOGIN || 'true').toLowerCase() !== 'false'
}