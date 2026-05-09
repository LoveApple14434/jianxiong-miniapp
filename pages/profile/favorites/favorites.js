const { profileAPI } = require('../../../services/api')
const { isUserLogin } = require('../../../utils/util')

Page({
  data: {
    defaultFavorites: [
      {
        id: 1,
        title: '第一章',
        desc: '起笔六朝松下，她以毫厘之准深耕科学疆域。',
        notes: 32,
        likes: 128
      },
      {
        id: 3,
        title: '第三章',
        desc: '远渡重洋的那一天，她回望故土，心中只有一个念头——学成归来，报效祖国。',
        notes: 18,
        likes: 88
      },
      {
        id: 5,
        title: '第五章',
        desc: '宇称不守恒的实验验证，让整个物理学界为之震动。这是实验物理学的巅峰时刻。',
        notes: 45,
        likes: 256
      }
    ],
    favorites: []
  },

  async onShow() {
    if (isUserLogin()) {
      try {
        const data = await profileAPI.getData()
        this.setData({ favorites: (data.favorites && data.favorites.length > 0) ? data.favorites : this.data.defaultFavorites })
        return
      } catch (err) {
        // fallback
      }
    }

    const savedFavorites = wx.getStorageSync('myFavorites')
    const favorites = savedFavorites && savedFavorites.length > 0 ? savedFavorites : this.data.defaultFavorites

    this.setData({ favorites })
  },

  removeFavorite(e) {
    const id = e.currentTarget.dataset.id
    const favorites = this.data.favorites.filter(item => item.id !== id)
    wx.setStorageSync('myFavorites', favorites)

    this.setData({ favorites })

    if (isUserLogin()) {
      profileAPI.saveData({ myFavorites: favorites }).catch(() => {})
    }

    wx.showToast({ title: '已取消收藏', icon: 'none' })
  }
})
