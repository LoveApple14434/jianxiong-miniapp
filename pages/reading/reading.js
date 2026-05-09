const { profileAPI } = require('../../services/api')
const { isUserLogin } = require('../../utils/util')

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
    notes: [
      { id: 1, avatar: '张', name: '张同学', time: '今天 12:30', content: '读到这里很触动，吴健雄先生在那个年代作为女性从事物理研究，需要多大的勇气和毅力。', likes: 12, isLiked: false },
      { id: 2, avatar: '李', name: '李同学', time: '今天 10:15', content: '作为理科生，感觉实验的严谨性和美感在先生身上得到了完美体现。', likes: 8, isLiked: false },
      { id: 3, avatar: '王', name: '王同学', time: '昨天 22:40', content: '先生的家国情怀令人敬佩，学术无国界，但学者有祖国。', likes: 24, isLiked: false }
    ],
    totalLikes: 0,
    favoritedChapterIds: []
  },

  onLoad() {
    this.setData({ activeChapter: this.data.chapters[0] })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }

    // 从本地存储恢复点赞状态
    const savedLikes = wx.getStorageSync('myLikes') || {}
    const notes = this.data.notes.map(note => ({
      ...note,
      isLiked: Boolean(savedLikes[note.id])
    }))

    const totalLikes = Object.keys(savedLikes).length

    // 加载收藏状态
    const savedFavorites = wx.getStorageSync('myFavorites') || []
    const favoritedChapterIds = savedFavorites.map(f => f.id)

    this.setData({ notes, totalLikes, favoritedChapterIds })
  },

  switchChapter(e) {
    const id = e.currentTarget.dataset.id
    const chapter = this.data.chapters.find(c => c.id === id)
    this.setData({ currentChapter: id, activeChapter: chapter })
  },

  writeNote() {
    wx.navigateTo({
      url: `/pages/writenote/writenote?title=${this.data.activeChapter.title}`,
      events: {
        notePublished: (newNote) => {
          this.setData({
            notes: [newNote, ...this.data.notes]
          })
        }
      }
    })
  },

  async addFavorite(e) {
    const chapterId = e.currentTarget.dataset.id
    const chapterData = e.currentTarget.dataset.chapter

    if (!chapterData) {
      wx.showToast({ title: '收藏失败', icon: 'none' })
      return
    }

    const newFavorite = {
      id: chapterId,
      title: chapterData.title,
      desc: chapterData.excerpt,
      notes: chapterData.notes,
      likes: chapterData.likes,
      addedAt: new Date().toISOString()
    }

    const favorites = wx.getStorageSync('myFavorites') || []
    const existingIndex = favorites.findIndex(f => f.id === chapterId)
    let favoritedChapterIds = this.data.favoritedChapterIds || []
    
    if (existingIndex >= 0) {
      favorites.splice(existingIndex, 1)
      favoritedChapterIds = favoritedChapterIds.filter(id => id !== chapterId)
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      favorites.unshift(newFavorite)
      if (!favoritedChapterIds.includes(chapterId)) {
        favoritedChapterIds.push(chapterId)
      }
      wx.showToast({ title: '已收藏', icon: 'success' })
    }

    wx.setStorageSync('myFavorites', favorites)
    this.setData({ favoritedChapterIds })

    if (isUserLogin()) {
      const { profileAPI } = require('../../services/api')
      try {
        await profileAPI.saveData({ myFavorites: favorites })
      } catch (err) {
        console.error('同步收藏失败:', err)
      }
    }
  },

  async toggleLike(e) {
    const noteId = e.currentTarget.dataset.id
    const savedLikes = wx.getStorageSync('myLikes') || {}

    const notes = this.data.notes.map(note => {
      if (note.id === noteId) {
        const wasLiked = Boolean(savedLikes[note.id])
        if (wasLiked) {
          delete savedLikes[note.id]
        } else {
          savedLikes[note.id] = true
        }

        wx.setStorageSync('myLikes', savedLikes)

        const totalLikes = Object.keys(savedLikes).length

        // 同步到后端统计
        if (isUserLogin()) {
          const readingStats = wx.getStorageSync('readingStats') || { readChapters: 0, noteCount: 0, likeCount: 0 }
          readingStats.likeCount = totalLikes
          wx.setStorageSync('readingStats', readingStats)

          profileAPI.saveData({ readingStats }).catch(err => {
            console.error('同步点赞统计失败:', err)
          })
        }

        this.setData({ totalLikes })

        return {
          ...note,
          isLiked: !wasLiked,
          likes: wasLiked ? note.likes - 1 : note.likes + 1
        }
      }
      return note
    })

    this.setData({ notes })
  }
})