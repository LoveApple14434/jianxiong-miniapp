// pages/community/community.js
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
    filteredPosts: [],
    commentInputVisible: null,
    commentContent: ''
  },

  onLoad() {
    this.loadPosts()
    this.filterPosts(0)
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    // 每次显示时重新加载（为了同步发帖后的新数据）
    this.loadPosts()
    this.filterPosts(this.data.currentTopic)
  },

  loadPosts() {
    let allPosts = wx.getStorageSync('community_posts')
    if (!allPosts || allPosts.length === 0) {
      const defaultPosts = [
        { id: 1, avatar: '张', name: '张三', time: '2小时前', topicId: 1, tag: '读后感',
          content: '今天读完第三章，吴健雄在哥伦比亚大学的实验经历太震撼了。一个人在深夜的实验室里反复验证，这份对科学的执着真的让人肃然起敬。',
          images: ['img1', 'img2'], likes: 24, commentsList: [], isLiked: false },
        { id: 5, avatar: '赵', name: '赵六', time: '6小时前', topicId: 1, tag: '读后感',
          content: '第五章关于宇称不守恒实验的描写太精彩了，读的时候手心都在出汗，仿佛自己也站在实验室里等待结果。',
          images: [], likes: 42, commentsList: [], isLiked: false },
        { id: 2, avatar: '李', name: '李四', time: '5小时前', topicId: 2, tag: '科学家精神',
          content: '分享一段关于宇称不守恒实验的纪录片片段，看完才真正理解这个实验的伟大之处。先生用最精确的实验推翻了物理学界几十年的"常识"。',
          images: [], likes: 56, commentsList: [], isLiked: false },
        { id: 6, avatar: '孙', name: '孙七', time: '昨天', topicId: 2, tag: '科学家精神',
          content: '吴健雄先生曾说"科学是没有国界的，但科学家是有祖国的"。在那个年代，她选择用科学报国，这种精神值得我们每一个人学习。',
          images: ['img1'], likes: 71, commentsList: [], isLiked: false },
        { id: 7, avatar: '周', name: '周八', time: '3小时前', topicId: 3, tag: '健雄精神',
          content: '作为健雄书院的学生，每次走过书院的走廊看到先生的照片，都会提醒自己：严谨、勇气、坚持——这就是健雄精神。',
          images: [], likes: 33, commentsList: [], isLiked: false },
        { id: 8, avatar: '吴', name: '吴九', time: '1天前', topicId: 3, tag: '健雄精神',
          content: '今天参加了书院组织的座谈会，听老师讲述先生当年在实验室的故事，特别是她作为女性物理学家面对的种种不公，却从未放弃的精神，深受触动。',
          images: ['img1', 'img2'], likes: 48, commentsList: [], isLiked: false },
        { id: 3, avatar: '王', name: '王五', time: '昨天', topicId: 4, tag: '活动打卡',
          content: '打卡第七天！坚持读《吴健雄传》，每天一章。先生说"在科学面前，没有性别之分"，这句话激励着无数女性科研工作者。',
          images: ['img1'], likes: 38, commentsList: [], isLiked: false },
        { id: 4, avatar: '陈', name: '陈十', time: '3天前', topicId: 4, tag: '活动打卡',
          content: '打卡第四天，今天读了第二章，先生在中央大学的求学经历让我感慨万千。同为南大学子，何其有幸能在同一片土地上追寻她的足迹。',
          images: [], likes: 29, commentsList: [], isLiked: false }
      ]
      allPosts = defaultPosts
      wx.setStorageSync('community_posts', allPosts)
    }
    this.allPosts = allPosts  // 保存在实例中，便于操作
    this.setData({ 
      filteredPosts: this.filterPostsByTopic(this.data.currentTopic, allPosts)
    })
  },

  savePosts() {
    wx.setStorageSync('community_posts', this.allPosts)
  },

  filterPostsByTopic(topicId, posts) {
    let filtered
    if (topicId === 0) {
      filtered = [...posts].sort((a, b) => b.id - a.id)
    } else {
      filtered = posts.filter(post => post.topicId === topicId).sort((a, b) => b.id - a.id)
    }
    return filtered
  },

  filterPosts(topicId) {
    const filtered = this.filterPostsByTopic(topicId, this.allPosts)
    this.setData({ filteredPosts: filtered })
  },

  switchTopic(e) {
    const topicId = e.currentTarget.dataset.id
    this.setData({ currentTopic: topicId })
    this.filterPosts(topicId)
  },

  // 帖子点赞（同时维护收藏）
  toggleLike(e) {
    const postId = e.currentTarget.dataset.id
    let allPosts = [...this.allPosts]
    let targetPost = null
    let updatedAll = allPosts.map(post => {
      if (post.id === postId) {
        targetPost = { ...post }
        const newLiked = !post.isLiked
        return {
          ...post,
          isLiked: newLiked,
          likes: newLiked ? post.likes + 1 : post.likes - 1
        }
      }
      return post
    })
    this.allPosts = updatedAll
    this.savePosts()
    this.filterPosts(this.data.currentTopic)

    if (targetPost) {
      targetPost.isLiked = !targetPost.isLiked
      targetPost.likes = targetPost.isLiked ? targetPost.likes + 1 : targetPost.likes - 1
      let favorites = wx.getStorageSync('favorites') || []
      if (targetPost.isLiked) {
        const exists = favorites.some(item => item.id === postId && item.source === 'community')
        if (!exists) {
          const topicName = this.getTopicName(targetPost.topicId)
          favorites.unshift({
            id: targetPost.id,
            avatar: targetPost.avatar,
            name: targetPost.name,
            time: targetPost.time,
            content: targetPost.content,
            likes: targetPost.likes,
            isLiked: targetPost.isLiked,
            tag: targetPost.tag,
            topicName: topicName,
            source: 'community',
            collectedAt: new Date().toLocaleString(),
            images: targetPost.images || []
          })
        }
      } else {
        favorites = favorites.filter(item => !(item.id === postId && item.source === 'community'))
      }
      wx.setStorageSync('favorites', favorites)
    }
  },

  getTopicName(topicId) {
    const topic = this.data.topics.find(t => t.id === topicId)
    return topic ? topic.name : '社区'
  },

  // 评论相关
  showCommentInput(e) {
    const postId = e.currentTarget.dataset.id
    this.setData({
      commentInputVisible: postId,
      commentContent: ''
    })
  },

  hideCommentInput() {
    this.setData({ commentInputVisible: null, commentContent: '' })
  },

  onCommentInput(e) {
    this.setData({ commentContent: e.detail.value })
  },

  submitComment(e) {
    const postId = e.currentTarget.dataset.id
    const content = this.data.commentContent.trim()
    if (!content) {
      wx.showToast({ title: '请输入评论', icon: 'none' })
      return
    }
    // 获取用户信息（简单模拟，可根据实际登录状态调整）
    const app = getApp()
    let name = '我'
    let avatar = '我'
    if (app.globalData && app.globalData.userInfo) {
      name = app.globalData.userInfo.nickName || name
      avatar = name.charAt(0)
    }
    const newComment = {
      id: Date.now(),
      avatar: avatar,
      name: name,
      content: content,
      time: '刚刚'
    }
    let allPosts = [...this.allPosts]
    const postIndex = allPosts.findIndex(p => p.id === postId)
    if (postIndex === -1) return
    const currentComments = allPosts[postIndex].commentsList || []
    const updatedComments = [newComment, ...currentComments]
    allPosts[postIndex].commentsList = updatedComments
    this.allPosts = allPosts
    this.savePosts()
    this.filterPosts(this.data.currentTopic)
    this.setData({ commentInputVisible: null, commentContent: '' })
    wx.showToast({ title: '评论成功', icon: 'success' })
  },

  createPost() {
    wx.navigateTo({ url: '/pages/publish/publish' })
  }
})