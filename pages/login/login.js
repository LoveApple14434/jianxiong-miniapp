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
    userProfileReady: false,
    wechatProfile: null,
    customNickName: '',
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
      const isDemoted = userProfile.is_demote || userProfile.nickName === '微信用户'

      console.log('[login] wx.getUserProfile result:', {
        nickName: userProfile.nickName,
        avatarUrl: userProfile.avatarUrl,
        gender: userProfile.gender,
        country: userProfile.country,
        province: userProfile.province,
        city: userProfile.city,
        language: userProfile.language,
        is_demote: userProfile.is_demote,
        raw: userProfile
      })

      if (isDemoted) {
        console.log('[login] WeChat profile demoted; prompting for custom nickname')
        this.setData({
          loading: false,
          userProfileReady: true,
          wechatProfile: userProfile,
          loginResult
        })
        return
      }

      this.wechatProfile = userProfile
      this.loginResult = loginResult
      await this.performLogin(userProfile)
    } catch (error) {
      const errorMessage = error && (error.message || error.errMsg) ? (error.message || error.errMsg) : '登录失败，请稍后重试'

      this.setData({ errorMessage })
      wx.showToast({ title: errorMessage, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async performLogin(userProfile) {
    this.setData({ loading: true, errorMessage: '' })

    try {
      const effectiveProfile = {
        nickName: this.data.customNickName && this.data.customNickName.trim() ? this.data.customNickName.trim() : userProfile.nickName,
        nickname: this.data.customNickName && this.data.customNickName.trim() ? this.data.customNickName.trim() : userProfile.nickName,
        avatarUrl: userProfile.avatarUrl,
        avatar: userProfile.avatarUrl,
        gender: userProfile.gender,
        country: userProfile.country,
        province: userProfile.province,
        city: userProfile.city,
        language: userProfile.language
      }

      const loginResult = this.loginResult
      const loginPayload = {
        code: loginResult.code,
        clientId: typeof getApp === 'function' && getApp().getClientId ? getApp().getClientId() : '',
        profile: effectiveProfile
      }

      console.log('[login] request payload:', {
        code: loginPayload.code,
        clientId: loginPayload.clientId,
        nickName: loginPayload.profile.nickName,
        avatarUrl: loginPayload.profile.avatarUrl
      })

      const loginResponse = await request({
        url: '/auth/login',
        method: 'POST',
        auth: false,
        data: loginPayload
      })

      console.log('[login] response user:', {
        nickName: loginResponse.user && loginResponse.user.nickName,
        avatarUrl: loginResponse.user && loginResponse.user.avatarUrl,
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
        wx.switchTab({ url: '/pages/profile/profile' })
      }, 250)

      this.setData({
        userProfileReady: false,
        customNickName: '',
        wechatProfile: null,
        loginResult: null
      })
    } catch (error) {
      const errorMessage = error && (error.message || error.errMsg) ? (error.message || error.errMsg) : '登录失败，请稍后重试'

      this.setData({ errorMessage })
      wx.showToast({ title: errorMessage, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onNickNameInput(e) {
    this.setData({ customNickName: e.detail.value })
  },

  async onConfirmNickName() {
    const nickName = this.data.customNickName ? this.data.customNickName.trim() : ''

    if (!nickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    await this.performLogin(this.data.wechatProfile)
  },

  onCancelNickName() {
    this.setData({
      userProfileReady: false,
      customNickName: '',
      wechatProfile: null,
      loginResult: null
    })
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' })
  }
})