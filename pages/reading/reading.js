const { profileAPI } = require('../../services/api.js')

Page({
  data: {
    currentChapter: 1,
    chapters: [
      { id: 1, title: '第一章', excerpt: '起笔六朝松下，她以毫厘之准深耕科学疆域。少年吴健雄在父亲的开明教育下，从小便对知识充满渴望。', notes: 32, likes: 128 },
      { id: 2, title: '第二章', excerpt: '在中央大学的求学岁月里，吴健雄展现出了非凡的物理天赋，师从施士元教授，打下坚实的实验物理基础。', notes: 24, likes: 96 },
      { id: 3, title: '第三章', excerpt: '远渡重洋的那一天，她回望故土，心中只有一个念头——学成归来，报效祖国。', notes: 18, likes: 88 },
      { id: 4, title: '第四章', excerpt: '在伯克利的实验室里，吴健雄凭借精湛的实验技术赢得了同行的尊重。', notes: 28, likes: 112 },
      { id: 5, title: '第五章', excerpt: '宇称不守恒的实验验证，让整个物理学界为之震动。这是实验物理学的巅峰时刻。', notes: 45, likes: 256 }
    ],
    activeChapter: {},
    notes: []
  },

  onLoad() {
    const chapters = this.data.chapters
    const currentChapterId = this.getDailyChapter()
    const activeChapter = chapters.find(c => c.id === currentChapterId) || chapters[0]
    this.setData({ 
      currentChapter: currentChapterId,
      activeChapter 
    }, () => {
      this.loadChapterNotes()
    })
  },

  getDailyChapter() {
    const date = new Date()
    const day = date.getDate()
    const chapters = this.data.chapters
    // 根据日期循环章节（每天轮换一个，1-31日对应不同章节）
    const chapterIndex = (day - 1) % chapters.length
    return chapters[chapterIndex]?.id || 1
  },

  getChapterKey(title) {
    return String(title || '').replace(/[^\w\u4e00-\u9fa5]/g, '').substring(0, 10)
  },

  async loadChapterNotes() {
    const chapter = this.data.activeChapter || {}

    if (!chapter.title) {
      return
    }

    try {
      const chapterId = this.getChapterKey(chapter.title)
      const notes = await profileAPI.listNotes({ chapterId })
      const safeNotes = Array.isArray(notes) ? notes : []
      const totalLikes = safeNotes.reduce((sum, note) => sum + (Number(note.likes) || 0), 0)

      this.setData({
        notes: safeNotes,
        activeChapter: {
          ...chapter,
          notes: safeNotes.length,
          likes: totalLikes
        }
      })
    } catch (error) {
      console.error('加载章节笔记失败:', error)
      this.setData({ notes: [] })
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }

    this.loadChapterNotes()
  },

  switchChapter(e) {
    const id = e.currentTarget.dataset.id
    const chapter = this.data.chapters.find(c => c.id === id)
    this.setData({ currentChapter: id, activeChapter: chapter }, () => {
      this.loadChapterNotes()
    })
  },

  writeNote() {
    const title = this.data.activeChapter.title
    wx.navigateTo({
      url: `/pages/writenote/writenote?title=${encodeURIComponent(title)}`
    })
  },

  viewNotes() {
    const chapter = this.data.activeChapter
    const chapterId = this.getChapterKey(chapter.title)
    wx.navigateTo({
      url: `/pages/profile/notes/notes?global=1&chapterId=${encodeURIComponent(chapterId)}&title=${encodeURIComponent(chapter.title)}`
    })
  }
})
