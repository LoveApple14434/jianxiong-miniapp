Page({
  data: {
    userInfo: null,
    avatarText: '健',
    displayName: '健雄学子',
    displayPhone: '未知用户',
    menuList: [
      { id: 'notes', icon: '📖', title: '我的书摘笔记' },
      { id: 'favorites', icon: '❤️', title: '我的收藏' },
      { id: 'progress', icon: '📊', title: '共读进度' },
      { id: 'badges', icon: '🏆', title: '成就徽章' },
      { id: 'settings', icon: '⚙️', title: '设置' }
    ]
  },

  onShow() {
    // 检查登录状态
    const app = getApp()
    if (!app.isUserLogin()) {
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }

    // 获取用户信息
    const userInfo = app.getUserInfo()
    const nickname = userInfo && userInfo.nickname ? userInfo.nickname : '健雄学子'
    const phone = userInfo && userInfo.phone ? userInfo.phone : '未知用户'
    const avatarText = userInfo && userInfo.nickname ? userInfo.nickname.charAt(0) : '健'
    this.setData({
      userInfo,
      avatarText,
      displayName: nickname,
      displayPhone: phone
    })

    // 更新Tab栏
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }
  },

  onMenuTap(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: `${id} 功能开发中`, icon: 'none' })
  },

  // 登出
  onLogout() {
    wx.showModal({
      title: '确认登出?',
      content: '您确定要登出吗?',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.logout()
        }
      }
    })
  }
})
