const { request } = require('../../utils/util')

const waitWechatLogin = () => new Promise((resolve, reject) => {
  wx.login({
    success: resolve,
    fail: reject
  })
})

Page({
  data: {
    loading: false,
    errorMessage: '',
    loginStep: 'welcome', // 'welcome' | 'profile' | 'process'
    loginCode: '',
    avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    nickName: '',
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

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail

    console.log('[login] avatar selected (temp):', avatarUrl)

    this.setData({ avatarUrl })
  },

  onNicknameBlur(e) {
    const nickName = e.detail.value

    console.log('[login] nickname input:', nickName)

    this.setData({ nickName })
  },

  async onConfirmProfile() {
    const { avatarUrl, nickName } = this.data

    if (!nickName || !nickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    if (!avatarUrl || avatarUrl.includes('mmbiz.qpic.cn')) {
      wx.showToast({ title: '请选择头像', icon: 'none' })
      return
    }

    this.setData({ loading: true, loginStep: 'process' })

    try {
      const permanentAvatarUrl = await this.uploadAvatar(avatarUrl)

      console.log('[login] avatar uploaded:', permanentAvatarUrl)

      await this.performLogin(permanentAvatarUrl, nickName.trim())
    } catch (error) {
      const errorMessage = error && (error.message || error.errMsg) ? (error.message || error.errMsg) : '登录失败'

      this.setData({ errorMessage, loading: false, loginStep: 'profile' })
      wx.showToast({ title: errorMessage, icon: 'none' })
    }
  },

  async uploadAvatar(tempFilePath) {
    return new Promise((resolve, reject) => {
      const app = typeof getApp === 'function' ? getApp() : null
      const apiBaseUrl = app && app.globalData && app.globalData.apiBaseUrl
        ? app.globalData.apiBaseUrl
        : 'https://loveapple.icu/api2/api'

      wx.uploadFile({
        url: `${apiBaseUrl}/upload/avatar`,
        filePath: tempFilePath,
        name: 'avatar',
        header: {
          Authorization: `Bearer ${app && typeof app.getToken === 'function' ? (app.getToken() || '') : ''}`
        },
        success(res) {
          try {
            // 处理响应数据：移除BOM字符和多余空格
            const dataString = typeof res.data === 'string' 
              ? res.data.trim().replace(/^\uFEFF/, '') 
              : JSON.stringify(res.data)
            
            const response = JSON.parse(dataString)

            console.log('[login] upload response:', { statusCode: res.statusCode, response })

            if (res.statusCode >= 200 && res.statusCode < 300 && response.code === 0) {
              if (!response.data || !response.data.permanentUrl) {
                reject(new Error('响应中缺少头像URL'))
                return
              }
              resolve(response.data.permanentUrl)
              return
            }

            reject(new Error(response.message || '头像上传失败'))
          } catch (error) {
            console.error('[login] avatar upload parse error:', { 
              error: error.message, 
              statusCode: res.statusCode,
              responseData: res.data 
            })
            reject(new Error('头像上传响应解析失败: ' + (error.message || '无效的JSON格式')))
          }
        },
        fail(res) {
          console.error('[login] avatar upload failed:', res)
          reject(new Error(`头像上传失败 (${res.statusCode}): ${res.data || res.errMsg}`))
        }
      })
    })
  },

  async performLogin(permanentAvatarUrl, nickName) {
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
          avatarUrl: permanentAvatarUrl,
          avatar: permanentAvatarUrl,
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
        this.setData({
          loading: false,
          loginStep: 'welcome',
          loginCode: '',
          avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
          nickName: ''
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