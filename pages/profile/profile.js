Page({
  data: {
    isLogin: false,
    authReady: false,
    userInfo: null,
    statList: [],
    menuList: [
      { id: 'notes', icon: '📖', title: '我的书摘笔记' },
      { id: 'favorites', icon: '❤️', title: '我的收藏' },
      { id: 'progress', icon: '📊', title: '共读进度' },
      { id: 'badges', icon: '🏆', title: '成就徽章' }
    ]
  },

  normalizeUserInfo(userInfo) {
    const source = userInfo || {}
    const nickName = typeof source.nickName === 'string' && source.nickName.trim()
      ? source.nickName.trim()
      : (typeof source.nickname === 'string' && source.nickname.trim() ? source.nickname.trim() : '')
    const avatarUrl = typeof source.avatarUrl === 'string' && source.avatarUrl.trim()
      ? source.avatarUrl.trim()
      : (typeof source.avatar === 'string' && source.avatar.trim() ? source.avatar.trim() : '')

    return {
      ...source,
      nickName,
      avatarUrl
    }
  },

  buildStatList(stats = {}) {
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

  async syncAuthState() {
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

    let statList = this.buildStatList()

    // 获取最新的 stats 数据
    if (isLogin) {
      try {
        const { profileAPI } = require('../../services/api')
        const data = await profileAPI.getData()
        statList = this.buildStatList(data.readingStats)
      } catch (err) {
        console.error('获取统计数据失败:', err)
      }
    }

    this.setData({
      isLogin,
      authReady: Boolean(authState.ready),
      userInfo,
      statList
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

    await this.syncAuthState()
  },

  onMenuTap(e) {
    const id = e.currentTarget.dataset.id

    if (!this.data.isLogin) {
      this.handleLogin()
      return
    }

    const routeMap = {
      notes: '/pages/profile/notes/notes',
      favorites: '/pages/profile/favorites/favorites',
      progress: '/pages/profile/progress/progress',
      badges: '/pages/profile/badges/badges',
      // settings removed
    }

    const url = routeMap[id]

    if (!url) {
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url
    })
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
