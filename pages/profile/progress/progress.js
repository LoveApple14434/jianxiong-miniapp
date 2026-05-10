const { profileAPI } = require('../../../services/api.js')
const { isUserLogin } = require('../../../utils/util')

Page({
  data: {
    progress: {
      readChapters: 0,
      totalChapters: 5,
      readDays: 0,
      percent: 0,
      currentChapter: '未开始',
      chapterList: [
        { id: 1, title: '第一章', finished: false },
        { id: 2, title: '第二章', finished: false },
        { id: 3, title: '第三章', finished: false },
        { id: 4, title: '第四章', finished: false },
        { id: 5, title: '第五章', finished: false }
      ]
    },
    progressStyle: 'width: 0%;',
    loading: true
  },

  async onShow() {
    this.setData({ loading: true })

    if (isUserLogin()) {
      try {
        const data = await profileAPI.getData()
        const savedProgress = data.readingProgress

        if (savedProgress) {
          const readChapters = savedProgress.readChapters || 0
          const totalChapters = savedProgress.totalChapters || 5
          const percent = Math.round((readChapters / totalChapters) * 100)

          this.setData({
            progress: {
              ...this.data.progress,
              ...savedProgress,
              percent
            },
            progressStyle: `width: ${percent}%;`,
            loading: false
          })

          return
        }
      } catch (err) {
        console.error('获取进度失败:', err)
        // fallback to local
      }
    }

    const savedProgress = wx.getStorageSync('readingProgress')

    if (savedProgress) {
      const readChapters = savedProgress.readChapters || 0
      const totalChapters = savedProgress.totalChapters || 5
      const percent = Math.round((readChapters / totalChapters) * 100)

      this.setData({
        progress: {
          ...this.data.progress,
          ...savedProgress,
          percent
        },
        progressStyle: `width: ${percent}%;`,
        loading: false
      })

      return
    }

    this.setData({ loading: false })
  },

  async markChapterFinished(e) {
    const id = e.currentTarget.dataset.id
    const chapter = this.data.progress.chapterList.find(c => c.id === id)

    if (!chapter) return

    const chapterList = this.data.progress.chapterList.map(c =>
      c.id === id ? { ...c, finished: !c.finished } : c
    )

    const readChapters = chapterList.filter(c => c.finished).length
    const totalChapters = chapterList.length
    const percent = Math.round((readChapters / totalChapters) * 100)
    const currentChapter = chapterList[readChapters - 1]?.title || '未开始'

    const progress = {
      ...this.data.progress,
      readChapters,
      percent,
      currentChapter,
      chapterList
    }

    wx.setStorageSync('readingProgress', progress)

    // 同时更新阅读统计
    const readingStats = wx.getStorageSync('readingStats') || { readChapters: 0, noteCount: 0, likeCount: 0 }
    readingStats.readChapters = readChapters
    wx.setStorageSync('readingStats', readingStats)

    this.setData({
      progress,
      progressStyle: `width: ${percent}%;`
    })

    if (isUserLogin()) {
      try {
        await profileAPI.saveData({ readingProgress: progress, readingStats })
      } catch (err) {
        console.error('保存进度失败:', err)
      }
    }
  }
})
