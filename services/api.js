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

const profileAPI = {
  getData() {
    return request({ url: '/profile/data', method: 'GET' })
  },
  saveData(payload) {
    return request({ url: '/profile/data', method: 'POST', data: payload })
  }
}

module.exports = {
  authAPI,
  profileAPI
}