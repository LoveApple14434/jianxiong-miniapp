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
      { id: 'badges', icon: '🏆', title: '成就徽章' },
      { id: 'settings', icon: '⚙️', title: '设置' }
    ]
  },

  buildStatList(userInfo) {
    const stats = userInfo || {}

    return [
      { value: stats.readChapters || 5, label: '已读章' },
      { value: stats.noteCount || 12, label: '笔记数' },
      { value: stats.likeCount || 32, label: '获赞数' }
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
    const userInfo = authState.userInfo
      ? {
          ...authState.userInfo,
          avatarUrl: authState.userInfo.avatarUrl || '',
          avatarText: authState.userInfo.nickName ? authState.userInfo.nickName.charAt(0) : '健',
          lastLoginText: this.formatLastLoginText(authState.userInfo.previousLoginAt)
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
  },

  onMenuTap(e) {
    const id = e.currentTarget.dataset.id

    if (!this.data.isLogin && id !== 'settings') {
      this.handleLogin()
      return
    }

    wx.showToast({ title: `${id} 功能开发中`, icon: 'none' })
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
