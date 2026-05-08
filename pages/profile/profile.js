Page({
  data: {
    menuList: [
      { id: 'notes', icon: '📖', title: '我的书摘笔记' },
      { id: 'favorites', icon: '❤️', title: '我的收藏' },
      { id: 'progress', icon: '📊', title: '共读进度' },
      { id: 'badges', icon: '🏆', title: '成就徽章' },
      { id: 'settings', icon: '⚙️', title: '设置' }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }
  },

  onMenuTap(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: `${id} 功能开发中`, icon: 'none' })
  }
})
