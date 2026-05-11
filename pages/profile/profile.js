const { profileAPI } = require('../../services/api.js')

Page({
  data: {
    isLogin: false,
    authReady: false,
    userInfo: null,
    statList: [],
    menuList: [
      { id: 'notes', icon: '📖', title: '我的书摘笔记' },
      { id: 'favorites', icon: '👍', title: '我的点赞' },
      { id: 'badges', icon: '🏆', title: '成就徽章' },
      { id: 'settings', icon: '⚙️', title: '设置' }
    ]
  },

  normalizeUserInfo(userInfo) {
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

    // 如果URL无效或为空，降级到昵称首字母显示
    if (!avatarUrl) {
      avatarUrl = ''
    } else if (!avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
      // 非HTTP(S)的URL视为无效
      avatarUrl = ''
    }

    return {
      ...source,
      nickName,
      avatarUrl
    }
  },

  buildStatList(userInfo) {
    const stats = userInfo || {}

    return [
      { value: stats.readChapters || 0, label: '已读章' },
      { value: stats.noteCount || 0, label: '笔记数' },
      { value: stats.likeCount || 0, label: '获赞数' }
    ]
  },

  formatLastLoginText(previousLoginAt) {
    if (!previousLoginAt) {
      return '首次登录'
    }

    const date = new Date(previousLoginAt)

    if (Number.isNaN(date.getTime())) {
      return '首次登录'
    }

    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')

    return `上次登录 ${month}-${day} ${hour}:${minute}`
  },

  syncAuthState() {
    const app = getApp()
    const authState = app.getAuthState ? app.getAuthState() : {}
    const isLogin = Boolean(authState.isLogin && authState.token)
    const normalizedUserInfo = authState.userInfo ? this.normalizeUserInfo(authState.userInfo) : null
    const userInfo = normalizedUserInfo
      ? {
          ...normalizedUserInfo,
          avatarText: normalizedUserInfo.nickName ? normalizedUserInfo.nickName.charAt(0) : '健',
          lastLoginText: this.formatLastLoginText(normalizedUserInfo.previousLoginAt)
        }
      : null

    this.setData({
      isLogin,
      authReady: Boolean(authState.ready),
      userInfo,
      statList: this.buildStatList(userInfo)
    })
  },

  async onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }

    const app = getApp()

    if (app && typeof app.refreshLoginStatus === 'function') {
      await app.refreshLoginStatus()
    }

    this.syncAuthState()

    // 如果已登录，从后端获取数据
    if (this.data.isLogin) {
      try {
        const res = await profileAPI.getData()
        if (res.code === 0) {
          const data = res.data
          // 更新本地数据
          this.setData({
            statList: this.buildStatList(data.readingStats),
            // 可以添加更多数据
          })
          // 保存到本地存储
          wx.setStorageSync('myNotes', data.notes)
          wx.setStorageSync('readingStats', data.readingStats)

          // 如果后端有更新的用户信息，更新头像显示
          if (data.profileInfo) {
            const updatedUserInfo = this.normalizeUserInfo(data.profileInfo)
            if (updatedUserInfo.avatarUrl || updatedUserInfo.nickName) {
              const currentUserInfo = this.data.userInfo || {}
              this.setData({
                userInfo: {
                  ...currentUserInfo,
                  ...updatedUserInfo,
                  avatarText: updatedUserInfo.nickName ? updatedUserInfo.nickName.charAt(0) : '健',
                  lastLoginText: currentUserInfo.lastLoginText
                }
              })
            }
          }
        }
      } catch (err) {
        console.error('获取profile数据失败:', err)
        wx.showToast({ title: '获取数据失败', icon: 'none' })
      }
    }
  },

  onMenuTap(e) {
    const id = e.currentTarget.dataset.id

    if (!this.data.isLogin && id !== 'settings') {
      this.handleLogin()
      return
    }

    const pageMap = {
      notes: '/pages/profile/notes/notes',
      favorites: '/pages/profile/favorites/favorites',
      progress: '/pages/profile/progress/progress',
      badges: '/pages/profile/badges/badges',
      settings: '/pages/login/login' // 暂时用登录页面作为设置
    }

    const url = pageMap[id]
    if (url) {
      wx.navigateTo({ url })
    } else {
      wx.showToast({ title: `${id} 功能开发中`, icon: 'none' })
    }
  },

  handleLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确认退出当前账号吗？',
      confirmColor: '#5B2D8E',
      success: res => {
        if (!res.confirm) {
          return
        }

        const app = getApp()
        app.clearLoginInfo()

        this.syncAuthState()
        wx.showToast({ title: '已退出登录', icon: 'none' })
      }
    })
  }
})
