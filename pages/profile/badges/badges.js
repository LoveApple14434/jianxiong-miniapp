Page({
  data: {
    badges: []
  },

  onShow() {
    const profileInfo = wx.getStorageSync('profileInfo') || {
      readDays: 12
    }

    const stats = wx.getStorageSync('readingStats') || {
      readChapters: 5,
      noteCount: 3,
      likeCount: 44
    }

    const badges = [
      {
        id: 'first-note',
        icon: '📝',
        title: '初次记录',
        desc: '写下 1 条书摘笔记',
        unlocked: stats.noteCount >= 1
      },
      {
        id: 'three-notes',
        icon: '📖',
        title: '勤于思考',
        desc: '累计拥有 3 条书摘笔记',
        unlocked: stats.noteCount >= 3
      },
      {
        id: 'five-chapters',
        icon: '🌟',
        title: '完成共读',
        desc: '完成 5 个章节阅读',
        unlocked: stats.readChapters >= 5
      },
      {
        id: 'seven-days',
        icon: '🔥',
        title: '坚持共读',
        desc: '共读达到 7 天',
        unlocked: profileInfo.readDays >= 7
      },
      {
        id: 'popular-note',
        icon: '❤️',
        title: '深受欢迎',
        desc: '累计获得 30 个赞',
        unlocked: stats.likeCount >= 30
      }
    ]

    this.setData({
      badges
    })
  }
})
