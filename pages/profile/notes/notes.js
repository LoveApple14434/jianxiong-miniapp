const { profileAPI } = require('../../../services/api.js')
const { isUserLogin } = require('../../../utils/util')

Page({
  data: {
    notes: [],
    loading: true,
    hasError: false,
    chapterId: null,
    chapterTitle: null,
    isChapterView: false
  },

  onLoad(options) {
    // 检查是否是从章节页面跳转来的
    if (options.chapter) {
      this.setData({
        chapterId: parseInt(options.chapter),
        chapterTitle: decodeURIComponent(options.title || ''),
        isChapterView: true
      })
    }
  },

  async onShow() {
    this.setData({ loading: true, hasError: false })

    let allNotes = []
    
    if (isUserLogin()) {
      try {
        const data = await profileAPI.getData()
        allNotes = (data.notes && Array.isArray(data.notes)) ? data.notes : []
      } catch (err) {
        console.error('获取笔记失败:', err)
      }
    }

    let savedNotes = wx.getStorageSync('myNotes')
    savedNotes = (savedNotes && Array.isArray(savedNotes)) ? savedNotes : []
    
    // 合并所有笔记
    allNotes = [...savedNotes, ...allNotes]
    
    // 如果是章节视图，过滤对应章节的笔记
    if (this.data.isChapterView && this.data.chapterId) {
      allNotes = allNotes.filter(note => note.chapterId === this.data.chapterId)
    }
    
    // 按点赞数排序（降序）
    allNotes.sort((a, b) => (b.likes || 0) - (a.likes || 0))
    
    this.setData({ notes: allNotes, loading: false })
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

        // 同步到后端
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
