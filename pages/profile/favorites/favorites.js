const { profileAPI } = require('../../../services/api.js')
const { isUserLogin } = require('../../../utils/util')

Page({
  data: {
    favorites: [],
    loading: true
  },

  async onShow() {
    this.setData({ loading: true })

    if (isUserLogin()) {
      try {
        const data = await profileAPI.getData()
        const favorites = (data.favorites && Array.isArray(data.favorites)) ? data.favorites : []
        this.setData({ favorites, loading: false })
        return
      } catch (err) {
        console.error('获取收藏失败:', err)
        // fallback to local storage
      }
    }

    const savedFavorites = wx.getStorageSync('myFavorites')
    const favorites = (savedFavorites && Array.isArray(savedFavorites)) ? savedFavorites : []
    this.setData({ favorites, loading: false })
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
      ...chapterData,
      addedAt: new Date().toISOString()
    }

    const favorites = this.data.favorites.filter(item => item.id !== chapterId)
    favorites.unshift(newFavorite)

    wx.setStorageSync('myFavorites', favorites)
    this.setData({ favorites })

    if (isUserLogin()) {
      try {
        await profileAPI.saveData({ myFavorites: favorites })
      } catch (err) {
        console.error('保存收藏失败:', err)
      }
    }

    wx.showToast({ title: '已收藏', icon: 'success' })
  },

  async removeFavorite(e) {
    const id = e.currentTarget.dataset.id
    const favorites = this.data.favorites.filter(item => item.id !== id)
    
    wx.setStorageSync('myFavorites', favorites)
    this.setData({ favorites })

    if (isUserLogin()) {
      try {
        await profileAPI.saveData({ myFavorites: favorites })
      } catch (err) {
        console.error('保存收藏失败:', err)
      }
    }

    wx.showToast({ title: '已取消收藏', icon: 'none' })
  }
})
