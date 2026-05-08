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
    // 用户信息
    userInfo: null,
    token: null,
    isLogin: false
  },

  onLaunch() {
    console.log('健雄书韵小程序启动')
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      const token = wx.getStorageSync('token')

      if (userInfo && token) {
        this.globalData.userInfo = userInfo
        this.globalData.token = token
        this.globalData.isLogin = true
      } else {
        this.globalData.isLogin = false
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
      this.globalData.isLogin = false
    }
  },

  // 获取登录状态
  isUserLogin() {
    return this.globalData.isLogin
  },

  // 获取用户信息
  getUserInfo() {
    return this.globalData.userInfo
  },

  // 获取Token
  getToken() {
    return this.globalData.token
  },

  // 设置用户登录状态
  setLoginInfo(userInfo, token) {
    this.globalData.userInfo = userInfo
    this.globalData.token = token
    this.globalData.isLogin = true
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('token', token)
  },

  // 登出
  logout() {
    this.globalData.userInfo = null
    this.globalData.token = null
    this.globalData.isLogin = false
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('token')
    wx.removeStorageSync('savedPhone')
    wx.removeStorageSync('savedPassword')
    
    // 跳转到登录页
    wx.reLaunch({
      url: '/pages/login/login'
    })
  }
})
