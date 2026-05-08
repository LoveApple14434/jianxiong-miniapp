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

module.exports = {
  authAPI
}