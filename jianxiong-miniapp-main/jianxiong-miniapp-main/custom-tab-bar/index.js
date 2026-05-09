Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/index/index',
        text: '发现',
        iconName: 'discover'
      },
      {
        pagePath: '/pages/timeline/timeline',
        text: '足迹',
        iconName: 'timeline'
      },
      {
        pagePath: '/pages/reading/reading',
        text: '共读',
        iconName: 'reading'
      },
      {
        pagePath: '/pages/community/community',
        text: '社区',
        iconName: 'community'
      },
      {
        pagePath: '/pages/profile/profile',
        text: '我的',
        iconName: 'profile'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({ url })
    }
  }
})
