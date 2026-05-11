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
        const favorites = (data.myLikes && Array.isArray(data.myLikes)) ? data.myLikes : []
        this.setData({ favorites, loading: false })
        return
      } catch (err) {
        console.error('获取点赞列表失败:', err)
        // fallback to local storage
      }
    }

    const savedLikes = wx.getStorageSync('myLikes')
    const favorites = (savedLikes && Array.isArray(savedLikes)) ? savedLikes : []
    this.setData({ favorites, loading: false })
  },

  async addFavorite(e) {
    const itemId = e.currentTarget.dataset.id
    const itemData = e.currentTarget.dataset.item

    if (!itemData) {
      wx.showToast({ title: '操作失败', icon: 'none' })
      return
    }

    const newLike = {
      id: itemId,
      ...itemData,
      likedAt: new Date().toISOString()
    }

    const favorites = this.data.favorites.filter(item => item.id !== itemId)
    favorites.unshift(newLike)

    wx.setStorageSync('myLikes', favorites)
    this.setData({ favorites })

    if (isUserLogin()) {
      try {
        await profileAPI.saveData({ myLikes: favorites })
      } catch (err) {
        console.error('保存点赞失败:', err)
      }
    }

    wx.showToast({ title: '已点赞', icon: 'success' })
  },

  async removeFavorite(e) {
    const id = e.currentTarget.dataset.id
    const favorites = this.data.favorites.filter(item => item.id !== id)
    
    wx.setStorageSync('myLikes', favorites)
    this.setData({ favorites })

    if (isUserLogin()) {
      try {
        await profileAPI.saveData({ myLikes: favorites })
      } catch (err) {
        console.error('保存点赞失败:', err)
      }
    }

    wx.showToast({ title: '已取消点赞', icon: 'none' })
  }
})
