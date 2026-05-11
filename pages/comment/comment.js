const app = getApp()
const { postAPI } = require('../../services/api.js')

const getCurrentUserInfo = () => {
  if (app && typeof app.getUserInfo === 'function') {
    return app.getUserInfo() || {}
  }

  return app && app.userInfo ? app.userInfo : {}
}

const getNickName = () => {
  const source = getCurrentUserInfo()

  if (typeof source.nickName === 'string' && source.nickName.trim()) {
    return source.nickName.trim()
  }

  if (typeof source.nickname === 'string' && source.nickname.trim()) {
    return source.nickname.trim()
  }

  return '健雄学子'
}

const getAvatarText = name => {
  const text = typeof name === 'string' && name.trim() ? name.trim() : '健雄学子'
  return text.charAt(0) || '健'
}

const normalizeAvatarText = (avatar, name) => {
  const text = typeof avatar === 'string' ? avatar.trim() : ''

  if (text.length === 1) {
    return text
  }

  return getAvatarText(name)
}

const normalizePost = post => {
  const name = post.name || post.authorName || '匿名'

  return {
    ...post,
    name,
    avatar: normalizeAvatarText(post.avatar, name)
  }
}

const normalizeComment = comment => {
  const rawName = comment.name || comment.authorName || '匿名'
  const name = rawName
  const isSelf = Boolean(comment.isSelf)

  return {
    ...comment,
    name,
    avatar: normalizeAvatarText(comment.avatar || comment.authorAvatar, name),
    isSelf
  }
}

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
        const normalizedPost = normalizePost(post || {})
        normalizedPost.commentsList = Array.isArray(normalizedPost.commentsList) ? normalizedPost.commentsList.map(normalizeComment) : []
        post.commentsList = Array.isArray(post.commentsList) ? post.commentsList.map(normalizeComment) : []
        this.setData({ post: normalizedPost, comments: normalizedPost.commentsList })
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
        const post = normalizePost(all.find(p => p.id === postId) || {})
        post.commentsList = Array.isArray(post.commentsList) ? post.commentsList.map(normalizeComment) : []
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
    const nickName = getNickName()

    if (!content) return

    wx.showLoading({ title: '提交中', mask: true })
    postAPI.addComment(postId, {
      content,
      authorName: nickName,
      authorAvatar: getAvatarText(nickName)
    })
      .then(comment => {
        let { post, comments } = this.data
        const newComment = normalizeComment({
          id: comment.id,
          avatar: comment.avatar,
          name: comment.name,
          time: comment.time,
          content: comment.content,
          authorName: nickName
        })
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