const { request } = require('./utils/util')

const STORAGE_KEYS = {
  token: 'login_token',
  userInfo: 'login_user_info',
  expiresAt: 'login_token_expires_at'
}

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3000/api'

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
    apiBaseUrl: "https://loveapple.icu/api2",
    auth: {
      token: '',
      userInfo: null,
      expiresAt: 0,
      isLogin: false,
      ready: false
    }
  },

  onLaunch() {
    console.log('健雄书韵小程序启动')
    this.restoreLoginState()
  },

  getAuthState() {
    return { ...this.globalData.auth }
  },

  isUserLogin() {
    return Boolean(this.globalData.auth.token && this.globalData.auth.isLogin)
  },

  getUserInfo() {
    return this.globalData.auth.userInfo
  },

  getToken() {
    return this.globalData.auth.token
  },

  setLoginInfo({ token, userInfo, expiresAt }) {
    const loginExpiresAt = expiresAt || (Date.now() + 7 * 24 * 60 * 60 * 1000)

    wx.setStorageSync(STORAGE_KEYS.token, token)
    wx.setStorageSync(STORAGE_KEYS.userInfo, userInfo)
    wx.setStorageSync(STORAGE_KEYS.expiresAt, loginExpiresAt)

    this.globalData.auth = {
      token,
      userInfo,
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
    const userInfo = wx.getStorageSync(STORAGE_KEYS.userInfo)
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
        userInfo: authState.user,
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
