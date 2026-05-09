const { profileAPI } = require('../../../services/api')
const { isUserLogin } = require('../../../utils/util')

Page({
  data: {
    progress: {
      readChapters: 5,
      totalChapters: 5,
      readDays: 12,
      percent: 100,
      currentChapter: '第五章',
      chapterList: [
        { id: 1, title: '第一章', finished: true },
        { id: 2, title: '第二章', finished: true },
        { id: 3, title: '第三章', finished: true },
        { id: 4, title: '第四章', finished: true },
        { id: 5, title: '第五章', finished: true }
      ]
    },

    progressStyle: 'width: 100%;'
  },

  async onShow() {
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
            progressStyle: `width: ${percent}%;`
          })

          return
        }
      } catch (err) {
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
        progressStyle: `width: ${percent}%;`
      })

      return
    }

    this.setData({ progressStyle: `width: ${this.data.progress.percent}%;` })
  }
})
