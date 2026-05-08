const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const STORAGE_KEYS = {
  token: 'login_token',
  userInfo: 'login_user_info',
  expiresAt: 'login_token_expires_at'
}

const DEFAULT_API_BASE_URL = 'https://loveapple.icu/api2/api'

const isAbsoluteUrl = url => /^https?:\/\//.test(url)

const resolveUrl = url => {
  if (isAbsoluteUrl(url)) {
    return url
  }

  const app = typeof getApp === 'function' ? getApp() : null
  const baseUrl = app && app.globalData && app.globalData.apiBaseUrl ? app.globalData.apiBaseUrl : DEFAULT_API_BASE_URL
  const normalizedPath = url.startsWith('/') ? url : `/${url}`

  return `${baseUrl}${normalizedPath}`
}

const getStoredAuth = () => {
  const token = wx.getStorageSync(STORAGE_KEYS.token)
  const userInfo = wx.getStorageSync(STORAGE_KEYS.userInfo)
  const expiresAt = Number(wx.getStorageSync(STORAGE_KEYS.expiresAt)) || 0

  return {
    token,
    userInfo,
    expiresAt,
    isLogin: Boolean(token) && (!expiresAt || expiresAt > Date.now())
  }
}

const isUserLogin = () => {
  const app = typeof getApp === 'function' ? getApp() : null

  if (app && typeof app.isUserLogin === 'function') {
    return app.isUserLogin()
  }

  return getStoredAuth().isLogin
}

const getLoginInfo = () => {
  const app = typeof getApp === 'function' ? getApp() : null

  if (app && typeof app.getAuthState === 'function') {
    return app.getAuthState()
  }

  return getStoredAuth()
}

const setLoginInfo = ({ token, userInfo, expiresAt }) => {
  const app = typeof getApp === 'function' ? getApp() : null

  if (app && typeof app.setLoginInfo === 'function') {
    return app.setLoginInfo({ token, userInfo, expiresAt })
  }

  const loginExpiresAt = expiresAt || (Date.now() + 7 * 24 * 60 * 60 * 1000)

  wx.setStorageSync(STORAGE_KEYS.token, token)
  wx.setStorageSync(STORAGE_KEYS.userInfo, userInfo)
  wx.setStorageSync(STORAGE_KEYS.expiresAt, loginExpiresAt)

  return {
    token,
    userInfo,
    expiresAt: loginExpiresAt,
    isLogin: true,
    ready: true
  }
}

const clearLoginInfo = () => {
  const app = typeof getApp === 'function' ? getApp() : null

  if (app && typeof app.clearLoginInfo === 'function') {
    return app.clearLoginInfo()
  }

  wx.removeStorageSync(STORAGE_KEYS.token)
  wx.removeStorageSync(STORAGE_KEYS.userInfo)
  wx.removeStorageSync(STORAGE_KEYS.expiresAt)
}

const validatePhone = phone => /^1\d{10}$/.test(String(phone || '').trim())

const validatePassword = password => typeof password === 'string' && password.trim().length >= 6

const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())

const mapNetworkErrorMessage = rawMessage => {
  const message = String(rawMessage || '')
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('url not in domain list') || lowerMessage.includes('url not in doamin list')) {
    return '当前域名未加入小程序 request 合法域名，请到微信公众平台开发设置中添加 loveapple.icu 并重新上传体验版'
  }

  return message || '网络请求失败'
}

const request = ({ url, method = 'GET', data = {}, header = {}, auth = true }) => {
  const app = typeof getApp === 'function' ? getApp() : null
  const token = auth ? (app && typeof app.getToken === 'function' ? app.getToken() : wx.getStorageSync(STORAGE_KEYS.token)) : ''

  return new Promise((resolve, reject) => {
    wx.request({
      url: resolveUrl(url),
      method,
      data,
      header: {
        'content-type': 'application/json',
        ...header,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success(res) {
        const payload = res.data || {}

        if (res.statusCode >= 200 && res.statusCode < 300 && payload.code === 0) {
          resolve(payload.data)
          return
        }

        reject({
          message: payload.message || payload.msg || payload.errMsg || '请求失败',
          statusCode: res.statusCode,
          response: res,
          data: payload
        })
      },
      fail(error) {
        reject({
          ...error,
          message: mapNetworkErrorMessage(error && (error.message || error.errMsg))
        })
      }
    })
  })
}

const checkPageLogin = ({ redirectUrl = '/pages/login/login', silent = false } = {}) => {
  if (isUserLogin()) {
    return true
  }

  if (!silent) {
    wx.showToast({ title: '请先登录', icon: 'none' })
  }

  wx.navigateTo({ url: redirectUrl })
  return false
}

module.exports = {
  formatTime,
  validatePhone,
  validatePassword,
  validateEmail,
  isUserLogin,
  getLoginInfo,
  setLoginInfo,
  clearLoginInfo,
  checkPageLogin,
  request,
  STORAGE_KEYS
}
