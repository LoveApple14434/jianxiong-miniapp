Page({
  data: {
    post: {},
    comments: [],
    replyText: '',
    postId: 0
  },

  onLoad(options) {
    const postId = parseInt(options.id)
    this.setData({ postId })

    // 从本地缓存找到这条帖子
    wx.getStorage({
      key: 'allPosts',
      success: res => {
        const all = res.data
        const post = all.find(p => p.id === postId)
        if (!post.commentsList) post.commentsList = []
        this.setData({
          post,
          comments: post.commentsList
        })
      }
    })
  },

  onInput(e) {
    this.setData({ replyText: e.detail.value })
  },

  // 删除自己评论
  delComment(e) {
    const cid = parseInt(e.currentTarget.dataset.cid)
    wx.showModal({
      title: '提示',
      content: '确定删除这条评论？',
      success: res => {
        if (res.confirm) {
          let { comments, post } = this.data
          // 过滤掉这条评论
          comments = comments.filter(c => c.id !== cid)
          // 更新帖子评论数和评论列表
          post.commentsList = comments
          post.comments = comments.length

          // 同步到本地缓存
          wx.getStorage({
            key: 'allPosts',
            success: res => {
              let all = res.data
              const idx = all.findIndex(p => p.id === post.id)
              if (idx > -1) {
                all[idx] = post
                wx.setStorageSync('allPosts', all)
              }
            }
          })

          this.setData({ comments, post })
          wx.showToast({ title: '已删除' })
        }
      }
    })
  },

  submit() {
    const content = this.data.replyText.trim()
    if (!content) return

    const newComment = {
      id: Date.now(),
      avatar: '我',
      name: '我',
      time: '刚刚',
      content
    }

    // 1. 本地更新评论列表
    let { post, comments } = this.data
    comments.unshift(newComment)
    post.commentsList = comments
    post.comments = comments.length

    // 2. 写回缓存
    wx.getStorage({
      key: 'allPosts',
      success: res => {
        let all = res.data
        const idx = all.findIndex(p => p.id === post.id)
        if (idx > -1) {
          all[idx] = post
          wx.setStorageSync('allPosts', all)
        }
      }
    })

    this.setData({
      post,
      comments,
      replyText: ''
    })

    wx.showToast({ title: '评论成功' })
  }
})