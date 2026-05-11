const { profileAPI } = require('../../../services/api.js')
const { isUserLogin } = require('../../../utils/util')

Page({
  data: {
    notes: [],
    loading: true,
    hasError: false,
    chapterId: null,
    chapterTitle: null,
    isChapterView: false,
    isGlobalView: false
  },

  onLoad(options) {
    const chapterId = options.chapterId || options.chapter || ''

    if (chapterId) {
      this.setData({
        chapterId: decodeURIComponent(chapterId),
        chapterTitle: decodeURIComponent(options.title || ''),
        isChapterView: true,
        isGlobalView: options.global === '1'
      })
    } else {
      this.setData({
        isGlobalView: false,
        isChapterView: false
      })
    }
  },

  async onShow() {
    this.setData({ loading: true, hasError: false })

    try {
      let notes = []

      if (this.data.isGlobalView || this.data.isChapterView) {
        notes = await profileAPI.listNotes(this.data.chapterId ? { chapterId: this.data.chapterId } : {})
      } else if (isUserLogin()) {
        const data = await profileAPI.getData()
        notes = (data.notes && Array.isArray(data.notes)) ? data.notes : []
      } else {
        notes = wx.getStorageSync('myNotes')
        notes = (notes && Array.isArray(notes)) ? notes : []
      }

      notes = Array.isArray(notes) ? notes : []
      notes.sort((a, b) => (b.likes || 0) - (a.likes || 0))

      this.setData({ notes, loading: false })
    } catch (error) {
      console.error('获取笔记失败:', error)
      this.setData({ notes: [], loading: false, hasError: true })
    }
  },

  async deleteNote(e) {
    const noteId = e.currentTarget.dataset.id

    wx.showModal({
      title: '删除笔记',
      content: '确定删除这条笔记吗？',
      confirmColor: '#5B2D8E',
      success: async (res) => {
        if (!res.confirm) return

        const notes = this.data.notes.filter(note => note.id !== noteId)
        wx.setStorageSync('myNotes', notes)

        // 更新笔记统计
        const readingStats = wx.getStorageSync('readingStats') || { readChapters: 0, noteCount: 0, likeCount: 0 }
        readingStats.noteCount = notes.length
        wx.setStorageSync('readingStats', readingStats)

        this.setData({ notes })

        if (isUserLogin()) {
          try {
            await profileAPI.saveData({ myNotes: notes, readingStats })
          } catch (err) {
            console.error('删除笔记同步失败:', err)
          }
        }

        wx.showToast({ title: '笔记已删除', icon: 'none' })
      }
    })
  }
})
