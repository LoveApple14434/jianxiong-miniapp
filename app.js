const { request } = require('./utils/util')

const STORAGE_KEYS = {
  token: 'login_token',
  userInfo: 'login_user_info',
  expiresAt: 'login_token_expires_at',
  clientId: 'login_client_id'
}

const PROD_API_BASE_URL = 'https://loveapple.icu/api2/api'

const getMiniProgramEnvVersion = () => {
  try {
    const accountInfo = typeof wx !== 'undefined' && wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
    const miniProgram = accountInfo && accountInfo.miniProgram ? accountInfo.miniProgram : null

    return miniProgram && miniProgram.envVersion ? miniProgram.envVersion : 'release'
  } catch (error) {
    return 'release'
  }
}

// 强制将 API 指向线上地址，避免任何环境回退到本地
const resolveApiBaseUrl = () => PROD_API_BASE_URL

const normalizeUserInfo = userInfo => {
  const source = userInfo || {}
  const nickName = typeof source.nickName === 'string' && source.nickName.trim()
    ? source.nickName.trim()
    : (typeof source.nickname === 'string' && source.nickname.trim() ? source.nickname.trim() : '')

  let avatarUrl = ''
  if (typeof source.avatarUrl === 'string' && source.avatarUrl.trim()) {
    avatarUrl = source.avatarUrl.trim()
  } else if (typeof source.avatar === 'string' && source.avatar.trim()) {
    avatarUrl = source.avatar.trim()
  }

  // 处理HTTP头像URL，微信小程序不支持HTTP图片
  if (avatarUrl && avatarUrl.startsWith('http://')) {
    // 如果是本地服务器的HTTP地址，清空URL，使用昵称首字母
    avatarUrl = ''
  }

  return {
    ...source,
    nickName,
    nickname: source.nickname || nickName,
    avatarUrl,
    avatar: source.avatar || avatarUrl
  }
}

const createClientId = () => `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

const mergeUserInfo = (baseUserInfo, nextUserInfo) => {
  const base = normalizeUserInfo(baseUserInfo)
  const next = normalizeUserInfo(nextUserInfo)

  return {
    ...base,
    ...next,
    nickName: next.nickName || base.nickName,
    nickname: next.nickname || base.nickname || base.nickName,
    avatarUrl: next.avatarUrl || base.avatarUrl,
    avatar: next.avatar || base.avatar || base.avatarUrl
  }
}

App({
  globalData: {
    theme: {
      primaryColor: '#5B2D8E',
      accentColor: '#C9A96E',
      bgColor: '#F8F5F0',
      darkBg: '#1A0F2E',
      textColor: '#2D2D2D',
      subTextColor: '#8C8C8C',
      lightGold: '#E8D5B5'
    },
    apiBaseUrl: PROD_API_BASE_URL,
    runtimeEnv: 'release',
    auth: {
      token: '',
      userInfo: null,
      expiresAt: 0,
      isLogin: false,
      ready: false
    }
  },

  onLaunch() {
    const envVersion = getMiniProgramEnvVersion()

    this.globalData.runtimeEnv = envVersion
    // 无论开发/体验/线上，一律使用线上 API
    this.globalData.apiBaseUrl = resolveApiBaseUrl()

    console.log('健雄书韵小程序启动')
    console.log('运行环境:', envVersion, '强制 API 基址:', this.globalData.apiBaseUrl)

    this.restoreLoginState()
  },

  getAuthState() {
    return { ...this.globalData.auth }
  },

  isUserLogin() {
    return Boolean(this.globalData.auth.token && this.globalData.auth.isLogin)
  },

  getUserInfo() {
    return normalizeUserInfo(this.globalData.auth.userInfo)
  },

  getToken() {
    return this.globalData.auth.token
  },

  getClientId() {
    let clientId = wx.getStorageSync(STORAGE_KEYS.clientId)

    if (!clientId) {
      clientId = createClientId()
      wx.setStorageSync(STORAGE_KEYS.clientId, clientId)
    }

    return clientId
  },

  setLoginInfo({ token, userInfo, expiresAt }) {
    const loginExpiresAt = expiresAt || (Date.now() + 7 * 24 * 60 * 60 * 1000)
    const normalizedUserInfo = normalizeUserInfo(userInfo)

    wx.setStorageSync(STORAGE_KEYS.token, token)
    wx.setStorageSync(STORAGE_KEYS.userInfo, normalizedUserInfo)
    wx.setStorageSync(STORAGE_KEYS.expiresAt, loginExpiresAt)

    this.globalData.auth = {
      token,
      userInfo: normalizedUserInfo,
      expiresAt: loginExpiresAt,
      isLogin: true,
      ready: true
    }

    return this.globalData.auth
  },

  clearLoginInfo() {
    wx.removeStorageSync(STORAGE_KEYS.token)
    wx.removeStorageSync(STORAGE_KEYS.userInfo)
    wx.removeStorageSync(STORAGE_KEYS.expiresAt)

    this.globalData.auth = {
      token: '',
      userInfo: null,
      expiresAt: 0,
      isLogin: false,
      ready: true
    }
  },

  async refreshLoginStatus() {
    const token = wx.getStorageSync(STORAGE_KEYS.token)
    const userInfo = normalizeUserInfo(wx.getStorageSync(STORAGE_KEYS.userInfo))
    const expiresAt = Number(wx.getStorageSync(STORAGE_KEYS.expiresAt)) || 0

    if (!token) {
      this.clearLoginInfo()
      return false
    }

    if (expiresAt && expiresAt <= Date.now()) {
      this.clearLoginInfo()
      return false
    }

    this.globalData.auth = {
      token,
      userInfo,
      expiresAt,
      isLogin: true,
      ready: false
    }

    try {
      const authState = await request({
        url: '/auth/me',
        method: 'GET'
      })

      this.setLoginInfo({
        token,
        userInfo: mergeUserInfo(userInfo, authState.user),
        expiresAt: authState.expiresAt
      })

      return true
    } catch (error) {
      this.clearLoginInfo()
      return false
    }
  },

  async restoreLoginState() {
    await this.refreshLoginStatus()
    this.globalData.auth.ready = true
  },

  ensureLogin(redirectUrl) {
    if (this.isUserLogin()) {
      return true
    }

    wx.showToast({ title: '请先登录', icon: 'none' })

    if (redirectUrl) {
      wx.navigateTo({ url: redirectUrl })
    }

    return false
  }
})
