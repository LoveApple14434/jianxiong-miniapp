const { request } = require('../../utils/util')

const waitWechatLogin = () => new Promise((resolve, reject) => {
  wx.login({
    success: resolve,
    fail: reject
  })
})

const getAvatarText = name => {
  const nickName = typeof name === 'string' && name.trim() ? name.trim() : '健雄学子'
  return nickName.charAt(0) || '健'
}

Page({
  data: {
    loading: false,
    errorMessage: '',
    loginStep: 'welcome', // 'welcome' | 'profile' | 'process'
    loginCode: '',
    nickName: '',
    previewProfile: {
      nickName: '健雄学子',
      avatarText: '健',
      signature: '登录后同步你的阅读记录与共读进度'
    },
    benefits: [
      { title: '同步阅读进度', desc: '登录后记录你的共读天数与章节足迹。' },
      { title: '保存个人资料', desc: '昵称、头像与偏好信息一次授权长期保留。' }
    ]
  },

  async handleLogin() {
    if (this.data.loading) {
      return
    }

    this.setData({ loading: true, errorMessage: '' })

    try {
      const loginResult = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      if (!loginResult.code) {
        throw new Error('未获取到微信登录凭证')
      }

      console.log('[login] weChat code obtained')

      this.setData({
        loading: false,
        loginStep: 'profile',
        loginCode: loginResult.code
      })
    } catch (error) {
      const errorMessage = error && (error.message || error.errMsg) ? (error.message || error.errMsg) : '获取登录凭证失败'

      this.setData({ errorMessage, loading: false })
      wx.showToast({ title: errorMessage, icon: 'none' })
    }
  },

  onNicknameBlur(e) {
    const nickName = e.detail.value

    console.log('[login] nickname input:', nickName)

    this.setData({
      nickName,
      previewProfile: {
        ...this.data.previewProfile,
        nickName: nickName || '健雄学子',
        avatarText: getAvatarText(nickName)
      }
    })
  },

  async onConfirmProfile() {
    const { nickName } = this.data

    if (!nickName || !nickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    this.setData({ loading: true, loginStep: 'process' })

    try {
      await this.performLogin(nickName.trim())
    } catch (error) {
      const errorMessage = error && (error.message || error.errMsg) ? (error.message || error.errMsg) : '登录失败'

      this.setData({ errorMessage, loading: false, loginStep: 'profile' })
      wx.showToast({ title: errorMessage, icon: 'none' })
    }
  },

  async performLogin(nickName) {
    this.setData({ loading: true, errorMessage: '' })

    try {
      const loginResult = this.data.loginCode
        ? { code: this.data.loginCode }
        : await new Promise((resolve, reject) => {
            wx.login({
              success: resolve,
              fail: reject
            })
          })

      const code = loginResult.code

      if (!code) {
        throw new Error('缺少微信登录凭证')
      }

      const loginPayload = {
        code,
        clientId: typeof getApp === 'function' && getApp().getClientId ? getApp().getClientId() : '',
        profile: {
          nickName,
          nickname: nickName,
          gender: 0,
          country: '',
          province: '',
          city: '',
          language: 'zh_CN'
        }
      }

      console.log('[login] request payload:', {
        code: loginPayload.code,
        clientId: loginPayload.clientId,
        nickName: loginPayload.profile.nickName,
        avatarText: getAvatarText(loginPayload.profile.nickName)
      })

      const loginResponse = await request({
        url: '/auth/login',
        method: 'POST',
        auth: false,
        data: loginPayload
      })

      console.log('[login] response user:', {
        nickName: loginResponse.user && loginResponse.user.nickName,
        avatarText: loginResponse.user && loginResponse.user.avatarText,
        previousLoginAt: loginResponse.user && loginResponse.user.previousLoginAt,
        loginCount: loginResponse.user && loginResponse.user.loginCount,
        sessionType: loginResponse.sessionType
      })

      const app = getApp()
      app.setLoginInfo({
        token: loginResponse.token,
        userInfo: loginResponse.user,
        expiresAt: loginResponse.expiresAt
      })

      wx.showToast({ title: '登录成功', icon: 'success' })

      setTimeout(() => {
        this.setData({
          loading: false,
          loginStep: 'welcome',
          loginCode: '',
          nickName: '',
          previewProfile: {
            nickName: '健雄学子',
            avatarText: '健',
            signature: '登录后同步你的阅读记录与共读进度'
          }
        })
        wx.switchTab({ url: '/pages/profile/profile' })
      }, 250)
    } catch (error) {
      const errorMessage = error && (error.message || error.errMsg) ? (error.message || error.errMsg) : '登录失败'

      this.setData({ errorMessage, loading: false, loginStep: 'profile' })
      wx.showToast({ title: errorMessage, icon: 'none' })
    }
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' })
  }
})