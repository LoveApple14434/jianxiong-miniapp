const app = getApp();
const { postAPI } = require('../../services/api.js')

const getCurrentUserInfo = () => {
  if (app && typeof app.getUserInfo === 'function') {
    return app.getUserInfo() || {}
  }

  return app && app.userInfo ? app.userInfo : {}
}

const getAvatarText = value => {
  if (typeof value !== 'string') {
    return '健'
  }

  const text = value.trim()
  return text ? text.charAt(0) : '健'
}

const normalizePostAvatar = post => {
  const name = post.name || post.authorName || '匿名'
  const fallbackAvatar = getAvatarText(name)
  const avatar = typeof post.avatar === 'string' ? post.avatar.trim() : ''

  if (!avatar) {
    return fallbackAvatar
  }

  if (avatar.length > 8) {
    return fallbackAvatar
  }

  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }

  return fallbackAvatar
}

Page({
  data: {
    currentTopic: 0,
    topics: [
      { id: 0, name: '全部' },
      { id: 1, name: '读后感' },
      { id: 2, name: '科学家精神' },
      { id: 3, name: '健雄精神' },
      { id: 4, name: '活动打卡' }
    ],
    allPosts: [],
    filteredPosts: [],
    myName: "健雄学子",
    myAvatar: ""
  },

  onLoad() {
    this.getMyInfo();
    this.loadPosts()
    this.sanitizeLocalCacheOnce()
  },

  sanitizeLocalCacheOnce() {
    try {
      const cleanedFlag = wx.getStorageSync('cacheCleaned_allPosts_v1')
      if (cleanedFlag) return

      const raw = wx.getStorageSync('allPosts')
      if (!Array.isArray(raw) || raw.length === 0) {
        wx.setStorageSync('cacheCleaned_allPosts_v1', true)
        return
      }

      const cleaned = raw.map(post => {
        const comments = Array.isArray(post.commentsList) ? post.commentsList.map(c => {
          const comment = { ...c }
          if (comment.name === '我') {
            // prefer an explicit authorName if present; otherwise fall back to 匿名
            if (comment.authorName && comment.authorName !== '我') {
              comment.name = comment.authorName
            } else {
              comment.name = '匿名'
            }
            comment.avatar = (comment.authorAvatar && String(comment.authorAvatar).trim().length === 1)
              ? comment.authorAvatar.trim()
              : (comment.name ? comment.name.charAt(0) : '匿')
            // clear isSelf for legacy entries
            comment.isSelf = false
          }
          return comment
        }) : []

        return {
          ...post,
          commentsList: comments,
          comments: comments.length
        }
      })

      wx.setStorageSync('allPosts', cleaned)
      wx.setStorageSync('cacheCleaned_allPosts_v1', true)
      wx.showToast({ title: '本地帖子缓存已清理', icon: 'success' })
    } catch (error) {
      console.error('[sanitizeLocalCacheOnce] error:', error)
    }
  },

  onShow() {
    this.getMyInfo();
    this.loadPosts()
    if (this.getTabBar) {
      this.getTabBar().setData({ selected: 3 })
    }
  },


  getMyInfo() {
    let nickName = '健雄学子'

    const source = getCurrentUserInfo()

    if (typeof source.nickName === 'string' && source.nickName.trim()) {
      nickName = source.nickName.trim()
    } else if (typeof source.nickname === 'string' && source.nickname.trim()) {
      nickName = source.nickname.trim()
    }

    this.setData({
      myName: nickName,
      myAvatar: nickName.charAt(0) || '健'
    })
  },

  loadPosts() {
    wx.showLoading({ title: '加载中', mask: true })
    postAPI.list()
      .then(posts => {
        const allPosts = (Array.isArray(posts) ? posts : []).map(post => ({
          ...post,
          name: post.name || post.authorName || '匿名',
          avatar: normalizePostAvatar(post)
        }))
        this.setData({ allPosts })
        wx.setStorageSync('allPosts', allPosts)
        this.filterPosts(this.data.currentTopic)
      })
      .catch(error => {
        wx.showToast({ title: error.message || '加载帖子失败', icon: 'none' })
        this.loadLocalPosts()
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  loadLocalPosts() {
    const defaultPosts = [
      { id: 1, avatar: '张', name: '张三', time: '2小时前', topicId: 1, tag: '读后感', content: '今天读完第三章', images: [], likes: 0, comments: 0 },
      { id: 5, avatar: '赵', name: '赵六', time: '6小时前', topicId: 1, tag: '读后感', content: '第五章关于宇称不守恒', images: [], likes: 0, comments: 0 }
    ]

    wx.getStorage({
      key: 'allPosts',
      success: res => {
        this.setData({ allPosts: res.data })
        this.filterPosts(this.data.currentTopic)
      },
      fail: () => {
        this.setData({ allPosts: defaultPosts })
        wx.setStorageSync('allPosts', defaultPosts)
        this.filterPosts(0)
      }
    })
  },

  doLike(e) {
    const postId = parseInt(e.currentTarget.dataset.id)
    let allPosts = this.data.allPosts
    let targetPost = allPosts.find(post => post.id === postId)

    if (!targetPost) {
      return
    }

    const delta = targetPost.isLiked ? -1 : 1
    wx.showLoading({ title: '更新中', mask: true })
    postAPI.like(postId, delta)
      .then(response => {
        allPosts = allPosts.map(post => {
          if (post.id === postId) {
            post.likes = typeof response.likes === 'number' ? response.likes : Math.max(0, (post.likes || 0) + delta)
            post.isLiked = !post.isLiked
          }
          return post
        })

        this.setData({ allPosts })
        wx.setStorageSync('allPosts', allPosts)
        this.filterPosts(this.data.currentTopic)
      })
      .catch(error => {
        wx.showToast({ title: error.message || '操作失败', icon: 'none' })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  switchTopic(e) {
    const topicId = e.currentTarget.dataset.id
    this.setData({ currentTopic: topicId })
    this.filterPosts(topicId)
  },

  filterPosts(topicId) {
    const all = this.data.allPosts
    let filtered
    if (topicId === 0) {
      filtered = all.slice().sort((a, b) => b.id - a.id)
    } else {
      filtered = all.filter(p => p.topicId === topicId).sort((a, b) => b.id - a.id)
    }
    this.setData({ filteredPosts: filtered })
  },

  openComment(e) {
    const postId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/comment/comment?id=' + postId
    })
  },

  delPost(e) {
    const postId = parseInt(e.currentTarget.dataset.id)
    wx.showModal({
      title: '提示',
      content: '确定要删除这条帖子吗？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中', mask: true })
          postAPI.delete(postId)
            .then(() => {
              let allPosts = this.data.allPosts.filter(p => p.id !== postId)
              this.setData({ allPosts })
              wx.setStorageSync('allPosts', allPosts)
              this.filterPosts(this.data.currentTopic)
              wx.showToast({ title: '已删除' })
            })
            .catch(error => {
              wx.showToast({ title: error.message || '删除失败', icon: 'none' })
            })
            .finally(() => {
              wx.hideLoading()
            })
        }
      }
    })
  },

  createPost() {
    wx.navigateTo({ url: '/pages/create-post/create-post' })
  }
})