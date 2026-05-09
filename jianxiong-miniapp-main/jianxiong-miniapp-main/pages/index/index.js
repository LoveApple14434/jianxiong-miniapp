Page({
  data: {
    // Hero 轮播数据
    heroList: [
      { id: 1, quote: '在科学面前，没有性别之分。' },
      { id: 2, quote: '科学是一种强有力的工具，怎样用它，取决于人本身。' },
      { id: 3, quote: '我生平最大的愿望，就是让中国强大起来。' }
    ],

    // 精选书摘
    bookExcerpts: [
      { id: 1, chapter: '第一章', text: '她站在实验室里，面对的不仅是物理的未知，更是时代对女性的偏见。', notes: 32 },
      { id: 2, chapter: '第三章', text: '远渡重洋的那一天，她回望故土，心中只有一个念头——学成归来。', notes: 18 },
      { id: 3, chapter: '第五章', text: '宇称不守恒的实验验证，让整个物理学界为之震动。', notes: 45 }
    ],

    // 时间轴预览
    timelinePreview: [
      { year: '1912', label: '诞生' },
      { year: '1936', label: '赴美' },
      { year: '1957', label: '宇称' },
      { year: '1997', label: '永恒' }
    ],

    // 今日共读
    todayReading: {
      chapter: '第三章：远渡重洋',
      desc: '1936年，年仅24岁的吴健雄踏上了前往美国的旅程。在加州大学伯克利分校，她遇到了改变她一生的导师...',
      participants: 32
    }
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

    // 更新Tab栏
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  goTimeline() {
    wx.switchTab({ url: '/pages/timeline/timeline' })
  },

  goReading() {
    wx.switchTab({ url: '/pages/reading/reading' })
  }
})
