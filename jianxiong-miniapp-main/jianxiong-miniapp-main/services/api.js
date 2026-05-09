const { request } = require('../utils/util')

const authAPI = {
  login(payload) {
    return request({
      url: '/auth/login',
      method: 'POST',
      auth: false,
      data: payload
    })
  },

  me() {
    return request({
      url: '/auth/me',
      method: 'GET'
    })
  },

  logout() {
    return request({
      url: '/auth/logout',
      method: 'POST'
    })
  }
}

const postAPI = {
  create(payload) {
    return request({
      url: '/posts',
      method: 'POST',
      data: payload
    })
  },
  list(params = {}) {
    return request({
      url: '/posts',
      method: 'GET',
      data: params
    })
  },
  get(postId) {
    return request({
      url: `/posts/${postId}`,
      method: 'GET'
    })
  },
  addComment(postId, payload) {
    return request({
      url: `/posts/${postId}/comments`,
      method: 'POST',
      data: payload
    })
  },
  like(postId, delta = 1) {
    return request({
      url: `/posts/${postId}/like`,
      method: 'POST',
      data: { delta }
    })
  },
  delete(postId) {
    return request({
      url: `/posts/${postId}`,
      method: 'DELETE'
    })
  },
  deleteComment(postId, commentId) {
    return request({
      url: `/posts/${postId}/comments/${commentId}`,
      method: 'DELETE'
    })
  }
}

module.exports = {
  authAPI,
  postAPI
}
