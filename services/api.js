/**
 * API 服务模块
 * 处理所有与后端的通信
 */

const util = require('../utils/util.js')

// API 基础 URL
const API_BASE_URL = 'https://api2.loveapple.icu' // 需要替换为实际的 API 地址

/**
 * 用户认证相关 API
 */
const authAPI = {
  /**
   * 登录
   * @param {string} phone - 手机号
   * @param {string} password - 密码
   * @returns {Promise}
   */
  login(phone, password) {
    return util.request({
      url: `${API_BASE_URL}/auth/login`,
      method: 'POST',
      data: {
        phone,
        password
      }
    })
  },

  /**
   * 注册
   * @param {object} data - 注册数据
   * @returns {Promise}
   */
  register(data) {
    return util.request({
      url: `${API_BASE_URL}/auth/register`,
      method: 'POST',
      data
    })
  },

  /**
   * 发送验证码
   * @param {string} phone - 手机号
   * @returns {Promise}
   */
  sendVerifyCode(phone) {
    return util.request({
      url: `${API_BASE_URL}/auth/verify-code`,
      method: 'POST',
      data: { phone }
    })
  },

  /**
   * 验证码登录
   * @param {string} phone - 手机号
   * @param {string} code - 验证码
   * @returns {Promise}
   */
  loginByCode(phone, code) {
    return util.request({
      url: `${API_BASE_URL}/auth/login-by-code`,
      method: 'POST',
      data: {
        phone,
        code
      }
    })
  },

  /**
   * 忘记密码
   * @param {string} phone - 手机号
   * @param {string} code - 验证码
   * @param {string} newPassword - 新密码
   * @returns {Promise}
   */
  resetPassword(phone, code, newPassword) {
    return util.request({
      url: `${API_BASE_URL}/auth/reset-password`,
      method: 'POST',
      data: {
        phone,
        code,
        newPassword
      }
    })
  },

  /**
   * 获取用户信息
   * @returns {Promise}
   */
  getUserInfo() {
    return util.request({
      url: `${API_BASE_URL}/user/info`,
      method: 'GET'
    })
  },

  /**
   * 更新用户信息
   * @param {object} data - 用户数据
   * @returns {Promise}
   */
  updateUserInfo(data) {
    return util.request({
      url: `${API_BASE_URL}/user/info`,
      method: 'PUT',
      data
    })
  },

  /**
   * 修改密码
   * @param {string} oldPassword - 旧密码
   * @param {string} newPassword - 新密码
   * @returns {Promise}
   */
  changePassword(oldPassword, newPassword) {
    return util.request({
      url: `${API_BASE_URL}/user/change-password`,
      method: 'POST',
      data: {
        oldPassword,
        newPassword
      }
    })
  },

  /**
   * 刷新 Token
   * @returns {Promise}
   */
  refreshToken() {
    return util.request({
      url: `${API_BASE_URL}/auth/refresh-token`,
      method: 'POST'
    })
  },

  /**
   * 登出
   * @returns {Promise}
   */
  logout() {
    return util.request({
      url: `${API_BASE_URL}/auth/logout`,
      method: 'POST'
    })
  }
}

/**
 * 书籍相关 API
 */
const bookAPI = {
  /**
   * 获取书籍列表
   * @returns {Promise}
   */
  getBooks() {
    return util.request({
      url: `${API_BASE_URL}/books`,
      method: 'GET'
    })
  },

  /**
   * 获取书籍详情
   * @param {string} bookId - 书籍 ID
   * @returns {Promise}
   */
  getBookDetail(bookId) {
    return util.request({
      url: `${API_BASE_URL}/books/${bookId}`,
      method: 'GET'
    })
  }
}

/**
 * 笔记相关 API
 */
const noteAPI = {
  /**
   * 获取笔记列表
   * @returns {Promise}
   */
  getNotes() {
    return util.request({
      url: `${API_BASE_URL}/notes`,
      method: 'GET'
    })
  },

  /**
   * 创建笔记
   * @param {object} data - 笔记数据
   * @returns {Promise}
   */
  /**
   * 微信登录（推荐）
   * @param {object} loginData - 登录数据
   * @param {string} loginData.code - wx.login 返回的 code
   * @param {string} loginData.encryptedData - 加密的用户数据
   * @param {string} loginData.iv - 加密算法的初始向量
   * @param {object} loginData.userInfo - 用户信息 (openid, nickName, avatarUrl, gender, province, city, country)
   * @returns {Promise}
   */
  wechatLogin(loginData) {
    return util.request({
      url: `${API_BASE_URL}/auth/wechat-login`,
      method: 'POST',
      data: loginData
    })
  },

  /**
   * 获取解密后的用户信息
   * @param {string} sessionKey - 会话密钥
   * @param {string} encryptedData - 加密的用户数据
   * @param {string} iv - 加密算法的初始向量
   * @returns {Promise}
   */
  decryptUserInfo(sessionKey, encryptedData, iv) {
    return util.request({
      url: `${API_BASE_URL}/auth/decrypt-userinfo`,
      method: 'POST',
      data: {
        sessionKey,
        encryptedData,
        iv
      }
    })
  },

  /**
   * 微信手机号授权登录
   * @param {object} data - 登录数据
   * @param {string} data.code - wx.login 返回的 code
   * @param {string} data.encryptedData - 加密的手机号数据
   * @param {string} data.iv - 加密算法的初始向量
   * @returns {Promise}
   */
  wechatPhoneLogin(data) {
    return util.request({
      url: `${API_BASE_URL}/auth/wechat-phone-login`,
      method: 'POST',
      data
    })
  },
  createNote(data) {
    return util.request({
      url: `${API_BASE_URL}/notes`,
      method: 'POST',
      data
    })
  },

  /**
   * 更新笔记
   * @param {string} noteId - 笔记 ID
   * @param {object} data - 笔记数据
   * @returns {Promise}
   */
  updateNote(noteId, data) {
    return util.request({
      url: `${API_BASE_URL}/notes/${noteId}`,
      method: 'PUT',
      data
    })
  },

  /**
   * 删除笔记
   * @param {string} noteId - 笔记 ID
   * @returns {Promise}
   */
  deleteNote(noteId) {
    return util.request({
      url: `${API_BASE_URL}/notes/${noteId}`,
      method: 'DELETE'
    })
  }
}

module.exports = {
  authAPI,
  bookAPI,
  noteAPI
}
