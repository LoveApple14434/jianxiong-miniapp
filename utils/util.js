const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 验证手机号格式
const validatePhone = phone => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 验证密码强度
const validatePassword = password => {
  return password && password.length >= 6
}

// 验证邮箱格式
const validateEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 检查用户是否已登录
const isUserLogin = () => {
  const app = getApp()
  return app.isUserLogin()
}

// 获取用户登录信息
const getLoginInfo = () => {
  const app = getApp()
  return {
    userInfo: app.getUserInfo(),
    token: app.getToken(),
    isLogin: app.isUserLogin()
  }
}

// 设置登录信息
const setLoginInfo = (userInfo, token) => {
  const app = getApp()
  app.setLoginInfo(userInfo, token)
}

// 登出
const logout = () => {
  const app = getApp()
  app.logout()
}

// 检查页面是否需要登录
const checkPageLogin = (options = {}) => {
  const { requireLogin = true, skipPages = [] } = options
  
  return {
    onLoad(query) {
      const currentPath = this.route
      const isSkipPage = skipPages.includes(currentPath)
      
      if (requireLogin && !isSkipPage && !isUserLogin()) {
        wx.reLaunch({
          url: '/pages/login/login'
        })
      }
    }
  }
}

// 网络请求拦截器
const request = (options = {}) => {
  const { url, method = 'GET', data, header = {} } = options
  
  return new Promise((resolve, reject) => {
    const token = getLoginInfo().token
    
    // 添加token到请求头
    const finalHeader = {
      ...header,
      'Content-Type': 'application/json'
    }
    
    if (token) {
      finalHeader['Authorization'] = `Bearer ${token}`
    }

    wx.request({
      url,
      method,
      data,
      header: finalHeader,
      success: (res) => {
        if (res.statusCode === 401) {
          // Token过期或无效，需要重新登录
          logout()
          reject(new Error('登录过期，请重新登录'))
        } else if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data)
        } else {
          reject(new Error(res.data?.msg || '请求失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

module.exports = {
  formatTime,
  formatNumber,
  validatePhone,
  validatePassword,
  validateEmail,
  isUserLogin,
  getLoginInfo,
  setLoginInfo,
  logout,
  checkPageLogin,
  request
}
