const app = getApp();

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
  },

  onShow() {
    this.getMyInfo();
    this.loadPosts()
    if (this.getTabBar) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  // =====================
  // 已修改：和你 app.js 完全一致的写法
  // =====================
  getMyInfo() {
    let nickName = "健雄学子";
    let avatarUrl = "";

    const source = app.userInfo || {};

    if (typeof source.nickName === 'string' && source.nickName.trim()) {
      nickName = source.nickName.trim();
    } else if (typeof source.nickname === 'string' && source.nickname.trim()) {
      nickName = source.nickname.trim();
    }

    if (typeof source.avatarUrl === 'string' && source.avatarUrl.trim()) {
      avatarUrl = source.avatarUrl.trim();
    } else if (typeof source.avatar === 'string' && source.avatar.trim()) {
      avatarUrl = source.avatar.trim();
    }

    this.setData({
      myName: nickName,
      myAvatar: avatarUrl
    });
  },

  loadPosts() {
    const defaultPosts = [
      { id: 1, avatar: '张', name: '张三', time: '2小时前', topicId: 1, tag: '读后感', content: '今天读完第三章', images: [], likes:0, comments:0 },
      { id: 5, avatar: '赵', name: '赵六', time: '6小时前', topicId:1, tag:'读后感', content:'第五章关于宇称不守恒', images:[], likes:0, comments:0 },
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

    allPosts = allPosts.map(post => {
      if (post.id === postId) {
        if (!post.isLiked) {
          post.likes += 1
          post.isLiked = true
        } else {
          post.likes -= 1
          post.isLiked = false
        }
      }
      return post
    })

    this.setData({ allPosts })
    wx.setStorageSync('allPosts', allPosts)
    this.filterPosts(this.data.currentTopic)
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
          let allPosts = this.data.allPosts.filter(p => p.id !== postId)
          this.setData({ allPosts })
          wx.setStorageSync('allPosts', allPosts)
          this.filterPosts(this.data.currentTopic)
          wx.showToast({ title: '已删除' })
        }
      }
    })
  },

  createPost() {
    wx.navigateTo({ url: '/pages/create-post/create-post' })
  }
})