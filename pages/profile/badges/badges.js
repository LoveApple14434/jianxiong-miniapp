const { profileAPI } = require('../../../services/api.js')
const { isUserLogin } = require('../../../utils/util')

Page({
  data: {
    badges: [],
    loading: true
  },

  async onShow() {
    this.setData({ loading: true })

    let profileInfo = { readDays: 0 }
    let stats = { readChapters: 0, noteCount: 0, likeCount: 0 }

    if (isUserLogin()) {
      try {
        const data = await profileAPI.getData()
        profileInfo = data.profileInfo || profileInfo
        stats = data.readingStats || stats
      } catch (err) {
        console.error('获取用户数据失败:', err)
        // fallback to local
        profileInfo = wx.getStorageSync('profileInfo') || profileInfo
        stats = wx.getStorageSync('readingStats') || stats
      }
    } else {
      profileInfo = wx.getStorageSync('profileInfo') || profileInfo
      stats = wx.getStorageSync('readingStats') || stats
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

    this.setData({ badges, loading: false })
  }
})
