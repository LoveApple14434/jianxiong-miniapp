const app = getApp()
const { authAPI } = require('../../services/api.js')

Page({
  data: {
    loading: false,
    userInfoFromWeChat: null,
    hasUserInfo: false,
    hasPhoneNumber: false,
    // 授权状态
    userInfoAuth: false,
    phoneNumberAuth: false
  },

  onLoad() {
    // 检查是否已登录
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.token) {
      this.redirectToHome()
    }

    // 检查用户是否已授权
    this.checkAuthStatus()
  },

  // 检查授权状态
  checkAuthStatus() {
    wx.getSetting({
      success: (res) => {
        const userInfoScope = res.authSetting['scope.userInfo']
        const phoneScope = res.authSetting['scope.phoneNumber']
        
        this.setData({
          userInfoAuth: userInfoScope === true,
          phoneNumberAuth: phoneScope === true
        })

        // 如果已授权用户信息和手机号，可以直接登录
        if (userInfoScope && phoneScope) {
          this.attemptAutoLogin()
        }
      }
    })
  },

  // 获取用户信息授权
  onGetUserInfo(e) {
    if (e.detail.errMsg === 'getUserInfo:ok') {
      this.setData({
        userInfoAuth: true,
        userInfoFromWeChat: e.detail.userInfo,
        hasUserInfo: true
      })

      // 如果已有手机号授权，可以直接登录
      if (this.data.phoneNumberAuth) {
        this.performLogin()
      }
    } else {
      wx.showToast({
        title: '需要授权用户信息',
        icon: 'none'
      })
    }
  },

  // 获取手机号授权
  onGetPhoneNumber(e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      this.setData({
        phoneNumberAuth: true,
        hasPhoneNumber: true,
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      })

      // 如果已有用户信息授权，可以直接登录
      if (this.data.userInfoAuth && this.data.hasUserInfo) {
        this.performLogin()
      }
    } else {
      wx.showToast({
        title: '需要授权手机号',
        icon: 'none'
      })
    }
  },

  // 尝试自动登录（用户已授权）
  attemptAutoLogin() {
    // 获取用户信息
    wx.getUserInfo({
      success: (res) => {
        this.setData({
          userInfoFromWeChat: res.userInfo,
          hasUserInfo: true
        })

        // 检查手机号授权
        wx.getSetting({
          success: (settingRes) => {
            if (settingRes.authSetting['scope.phoneNumber']) {
              this.performLogin()
            }
          }
        })
      }
    })
  },

  // 执行登录流程
  async performLogin() {
    this.setData({ loading: true })

    try {
      wx.showLoading({
        title: '登录中...',
        mask: true
      })

      // 第一步：获取临时登录凭证
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: (res) => {
            if (res.code) {
              resolve(res.code)
            } else {
              reject(new Error('获取登录凭证失败'))
            }
          },
          fail: reject
        })
      })

      // 第二步：调用后端登录接口
      const phone = this.data.data?.phone
      const encryptedData = this.data.encryptedData
      const iv = this.data.iv

      const response = await authAPI.wechatLogin({
        code: loginRes,
        encryptedData,
        iv,
        userInfo: this.data.userInfoFromWeChat
      })

      if (response && response.code === 0) {
        // 保存用户信息和token
        const userInfo = response.data
        wx.setStorageSync('userInfo', userInfo)
        wx.setStorageSync('token', userInfo.token)
        wx.setStorageSync('sessionKey', userInfo.sessionKey || '')

        // 更新全局用户信息
        app.globalData.userInfo = userInfo
        app.globalData.isLogin = true

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })

        // 延迟重定向，让用户看到成功提示
        setTimeout(() => {
          this.redirectToHome()
        }, 1500)
      } else {
        throw new Error(response?.msg || '登录失败')
      }
    } catch (error) {
      console.error('登录错误:', error)
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
      this.setData({ loading: false })
    }
  },

  // 重定向到首页
  redirectToHome() {
    wx.reLaunch({
      url: '/pages/index/index',
      fail() {
        console.error('重定向失败')
      }
    })
  }
})
