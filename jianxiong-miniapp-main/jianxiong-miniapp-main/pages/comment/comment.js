const app = getApp()
const { postAPI } = require('../../services/api.js')

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
    this.loadPost(postId)
  },

  loadPost(postId) {
    wx.showLoading({ title: '加载中', mask: true })
    postAPI.get(postId)
      .then(post => {
        post.commentsList = Array.isArray(post.commentsList) ? post.commentsList : []
        this.setData({ post, comments: post.commentsList })
      })
      .catch(() => {
        this.loadPostFromLocal(postId)
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  loadPostFromLocal(postId) {
    wx.getStorage({
      key: 'allPosts',
      success: res => {
        const all = res.data || []
        const post = all.find(p => p.id === postId) || {}
        post.commentsList = Array.isArray(post.commentsList) ? post.commentsList : []
        this.setData({ post, comments: post.commentsList })
      }
    })
  },

  onInput(e) {
    this.setData({ replyText: e.detail.value })
  },

  // 删除自己评论
  delComment(e) {
    const cid = parseInt(e.currentTarget.dataset.cid)
    const postId = this.data.postId

    wx.showModal({
      title: '提示',
      content: '确定删除这条评论？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中', mask: true })
          postAPI.deleteComment(postId, cid)
            .then(() => {
              let { comments, post } = this.data
              comments = comments.filter(c => c.id !== cid)
              post.commentsList = comments
              post.comments = comments.length
              this.setData({ comments, post })
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

  submit() {
    const content = this.data.replyText.trim()
    const postId = this.data.postId

    if (!content) return

    wx.showLoading({ title: '提交中', mask: true })
    postAPI.addComment(postId, { content })
      .then(comment => {
        let { post, comments } = this.data
        const newComment = {
          id: comment.id,
          avatar: comment.avatar,
          name: comment.name,
          time: comment.time,
          content: comment.content
        }
        comments.unshift(newComment)
        post.commentsList = comments
        post.comments = comments.length

        this.setData({
          post,
          comments,
          replyText: ''
        })
        wx.showToast({ title: '评论成功' })
      })
      .catch(error => {
        wx.showToast({ title: error.message || '评论失败', icon: 'none' })
      })
      .finally(() => {
        wx.hideLoading()
      })
  }
})