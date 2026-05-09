const { profileAPI } = require('../../../services/api')
const { isUserLogin } = require('../../../utils/util')

Page({
  data: {
    notes: [],
    loading: true,
    hasError: false
  },

  async onShow() {
    this.setData({ loading: true, hasError: false })

    if (isUserLogin()) {
      try {
        const data = await profileAPI.getData()
        const notes = (data.notes && Array.isArray(data.notes)) ? data.notes : []
        this.setData({ notes, loading: false })
        return
      } catch (err) {
        console.error('获取笔记失败:', err)
        // fallback to local storage
      }
    }

    const savedNotes = wx.getStorageSync('myNotes')
    const notes = (savedNotes && Array.isArray(savedNotes)) ? savedNotes : []
    this.setData({ notes, loading: false })
  }
})
