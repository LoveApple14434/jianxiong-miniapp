const { request } = require('../../utils/util')

const waitWechatLogin = () => new Promise((resolve, reject) => {
  wx.login({
    success: resolve,
    fail: reject
  })
})

const waitUserProfile = () => new Promise((resolve, reject) => {
  wx.getUserProfile({
    desc: '用于完善你的个人中心与登录信息',
    success: resolve,
    fail: reject
  })
})

Page({
  data: {
    loading: false,
    errorMessage: '',
    previewProfile: {
      nickName: '健雄学子',
      signature: '登录后同步你的阅读记录与共读进度'
    },
    benefits: [
      { title: '同步阅读进度', desc: '登录后记录你的共读天数与章节足迹。' },
      { title: '保存个人资料', desc: '昵称、头像与偏好信息一次授权长期保留。' },
      { title: '后端统一认证', desc: '通过后端 JWT 统一管理会话状态。' }
    ]
  },

  async handleLogin() {
    if (this.data.loading) {
      return
    }

    this.setData({ loading: true, errorMessage: '' })

    try {
      const [loginResult, profileResult] = await Promise.all([
        waitWechatLogin(),
        waitUserProfile()
      ])

      if (!loginResult.code) {
        throw new Error('未获取到微信登录凭证')
      }

      const userProfile = profileResult.userInfo || {}
      const loginResponse = await request({
        url: '/auth/login',
        method: 'POST',
        auth: false,
        data: {
          code: loginResult.code,
          clientId: typeof getApp === 'function' && getApp().getClientId ? getApp().getClientId() : '',
          profile: {
            nickName: userProfile.nickName,
            nickname: userProfile.nickName,
            avatarUrl: userProfile.avatarUrl,
            avatar: userProfile.avatarUrl,
            gender: userProfile.gender,
            country: userProfile.country,
            province: userProfile.province,
            city: userProfile.city,
            language: userProfile.language
          }
        }
      })

      const app = getApp()
      app.setLoginInfo({
        token: loginResponse.token,
        userInfo: loginResponse.user,
        expiresAt: loginResponse.expiresAt
      })

      wx.showToast({ title: '登录成功', icon: 'success' })

      setTimeout(() => {
        wx.switchTab({ url: '/pages/profile/profile' })
      }, 250)
    } catch (error) {
      const errorMessage = error && (error.message || error.errMsg) ? (error.message || error.errMsg) : '登录失败，请稍后重试'

      this.setData({ errorMessage })
      wx.showToast({ title: errorMessage, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' })
  }
})