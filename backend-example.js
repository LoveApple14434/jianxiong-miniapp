/**
 * 微信小程序登录 - Node.js + Express 后端实现示例
 * 
 * 安装依赖：
 * npm install express axios crypto jsonwebtoken mongoose bcryptjs cors dotenv
 */

const express = require('express')
const axios = require('axios')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const cors = require('cors')
require('dotenv').config()

const app = express()

// 中间件
app.use(cors())
app.use(express.json())

// 环境变量
const WECHAT_APP_ID = process.env.WECHAT_APP_ID
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'

// ============================================
// 工具函数
// ============================================

/**
 * AES-128-CBC 解密函数
 */
function decrypt(encryptedData, sessionKey, iv) {
  try {
    const encrypted = Buffer.from(encryptedData, 'base64')
    const key = Buffer.from(sessionKey, 'base64')
    const vector = Buffer.from(iv, 'base64')
    
    const cipher = crypto.createDecipheriv('aes-128-cbc', key, vector)
    let decrypted = cipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, cipher.final()])
    
    const decryptedStr = decrypted.toString('utf8')
    return JSON.parse(decryptedStr)
  } catch (error) {
    console.error('解密失败:', error)
    throw new Error('数据解密失败')
  }
}

/**
 * 生成 JWT Token
 */
function generateToken(userId, openid) {
  return jwt.sign(
    {
      userId,
      openid,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: '7d' }  // token 有效期 7 天
  )
}

/**
 * 验证 JWT Token 中间件
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return res.status(401).json({
      code: 1,
      msg: '缺少认证信息'
    })
  }

  const token = authHeader.replace('Bearer ', '')
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      code: 1,
      msg: 'Token 无效或已过期'
    })
  }
}

// ============================================
// 用户数据库模型（示例）
// ============================================

// 实际应该使用 MongoDB 或其他数据库
// 这里用一个简单的内存对象模拟
const usersDB = new Map()

class User {
  constructor(data) {
    this._id = data._id || Date.now().toString()
    this.openid = data.openid
    this.nickname = data.nickname
    this.avatar = data.avatar
    this.gender = data.gender || 0
    this.province = data.province || ''
    this.city = data.city || ''
    this.country = data.country || ''
    this.phone = data.phone
    this.sessionKey = data.sessionKey
    this.createdAt = data.createdAt || new Date()
    this.lastLoginAt = data.lastLoginAt || new Date()
  }

  static create(data) {
    const user = new User(data)
    usersDB.set(user._id, user)
    return user
  }

  static findOne(query) {
    for (const [, user] of usersDB) {
      for (const [key, value] of Object.entries(query)) {
        if (user[key] === value) {
          return user
        }
      }
    }
    return null
  }

  static findByIdAndUpdate(id, data) {
    const user = usersDB.get(id)
    if (user) {
      Object.assign(user, data)
      usersDB.set(id, user)
    }
    return user
  }
}

// ============================================
// API 端点
// ============================================

/**
 * 微信登录 API
 * POST /auth/wechat-login
 */
app.post('/auth/wechat-login', async (req, res) => {
  try {
    const { code, encryptedData, iv, userInfo } = req.body

    // 验证参数
    if (!code) {
      return res.status(400).json({
        code: 1,
        msg: '缺少 code 参数'
      })
    }

    if (!userInfo || !userInfo.nickName) {
      return res.status(400).json({
        code: 1,
        msg: '缺少用户信息'
      })
    }

    console.log('开始登录流程，code:', code)

    // 第1步：使用 code 交换 session_key 和 openid
    let wxResponse
    try {
      wxResponse = await axios.get(
        'https://api.weixin.qq.com/sns/jscode2session',
        {
          params: {
            appid: WECHAT_APP_ID,
            secret: WECHAT_APP_SECRET,
            js_code: code,
            grant_type: 'authorization_code'
          }
        }
      )
    } catch (error) {
      console.error('微信 API 调用失败:', error.message)
      return res.status(400).json({
        code: 1,
        msg: '微信验证失败: ' + error.message
      })
    }

    const { errcode, errmsg, session_key, openid } = wxResponse.data

    if (errcode) {
      console.error('微信返回错误:', errmsg)
      return res.status(400).json({
        code: 1,
        msg: '微信验证失败: ' + errmsg
      })
    }

    console.log('微信验证成功，openid:', openid)

    // 第2步：解密手机号（如果提供了加密数据）
    let phone = null
    if (encryptedData && iv) {
      try {
        const phoneData = decrypt(encryptedData, session_key, iv)
        phone = phoneData.phoneNumber
        console.log('手机号解密成功:', phone)
      } catch (error) {
        console.warn('手机号解密失败:', error.message)
        // 不返回错误，允许没有手机号的登录
      }
    }

    // 第3步：查询或创建用户
    let user = User.findOne({ openid })

    if (!user) {
      // 新用户，创建账户
      user = User.create({
        openid,
        nickname: userInfo.nickName,
        avatar: userInfo.avatarUrl,
        gender: userInfo.gender || 0,
        province: userInfo.province || '',
        city: userInfo.city || '',
        country: userInfo.country || '',
        phone: phone,
        sessionKey: session_key
      })
      console.log('创建新用户:', user._id)
    } else {
      // 既有用户，更新信息
      user = User.findByIdAndUpdate(user._id, {
        nickname: userInfo.nickName,
        avatar: userInfo.avatarUrl,
        gender: userInfo.gender || user.gender,
        phone: phone || user.phone,
        sessionKey: session_key,
        lastLoginAt: new Date()
      })
      console.log('更新既有用户:', user._id)
    }

    // 第4步：生成 JWT Token
    const token = generateToken(user._id, user.openid)
    console.log('生成 Token 成功')

    // 第5步：返回用户信息和 token
    res.json({
      code: 0,
      msg: '登录成功',
      data: {
        token,
        userId: user._id,
        nickname: user.nickname,
        phone: user.phone,
        avatar: user.avatar,
        gender: user.gender,
        createdAt: user.createdAt,
        sessionKey: session_key
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      code: 1,
      msg: '登录失败: ' + error.message
    })
  }
})

/**
 * 解密用户信息 API
 * POST /auth/decrypt-userinfo
 */
app.post('/auth/decrypt-userinfo', verifyToken, (req, res) => {
  try {
    const { sessionKey, encryptedData, iv } = req.body

    if (!sessionKey || !encryptedData || !iv) {
      return res.status(400).json({
        code: 1,
        msg: '缺少必要参数'
      })
    }

    const decryptedData = decrypt(encryptedData, sessionKey, iv)

    res.json({
      code: 0,
      msg: '解密成功',
      data: decryptedData
    })
  } catch (error) {
    console.error('解密错误:', error)
    res.status(400).json({
      code: 1,
      msg: '解密失败: ' + error.message
    })
  }
})

/**
 * 获取用户信息 API
 * GET /auth/user-info
 */
app.get('/user/info', verifyToken, (req, res) => {
  try {
    const user = usersDB.get(req.user.userId)

    if (!user) {
      return res.status(404).json({
        code: 1,
        msg: '用户不存在'
      })
    }

    res.json({
      code: 0,
      msg: '获取成功',
      data: {
        userId: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        gender: user.gender,
        province: user.province,
        city: user.city,
        country: user.country,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({
      code: 1,
      msg: '获取失败: ' + error.message
    })
  }
})

/**
 * 更新用户信息 API
 * PUT /user/info
 */
app.put('/user/info', verifyToken, (req, res) => {
  try {
    const { nickname, avatar } = req.body
    const userId = req.user.userId

    const user = User.findByIdAndUpdate(userId, {
      nickname: nickname || undefined,
      avatar: avatar || undefined
    })

    if (!user) {
      return res.status(404).json({
        code: 1,
        msg: '用户不存在'
      })
    }

    res.json({
      code: 0,
      msg: '更新成功',
      data: {
        userId: user._id,
        nickname: user.nickname,
        avatar: user.avatar
      }
    })
  } catch (error) {
    console.error('更新用户信息错误:', error)
    res.status(500).json({
      code: 1,
      msg: '更新失败: ' + error.message
    })
  }
})

/**
 * 登出 API
 * POST /auth/logout
 */
app.post('/auth/logout', verifyToken, (req, res) => {
  // JWT 无状态，登出只需要前端删除 token 即可
  res.json({
    code: 0,
    msg: '登出成功'
  })
})

/**
 * 刷新 Token API
 * POST /auth/refresh-token
 */
app.post('/auth/refresh-token', verifyToken, (req, res) => {
  try {
    const userId = req.user.userId
    const openid = req.user.openid

    const newToken = generateToken(userId, openid)

    res.json({
      code: 0,
      msg: 'Token 刷新成功',
      data: {
        token: newToken
      }
    })
  } catch (error) {
    console.error('刷新 Token 错误:', error)
    res.status(500).json({
      code: 1,
      msg: '刷新失败: ' + error.message
    })
  }
})

// ============================================
// 健康检查
// ============================================

/**
 * 健康检查 API
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    code: 0,
    msg: '服务运行正常',
    timestamp: new Date().toISOString()
  })
})

// ============================================
// 错误处理
// ============================================

app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    code: -1,
    msg: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// ============================================
// 启动服务
// ============================================

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`
================================================================
微信小程序登录服务已启动
================================================================
服务地址: http://localhost:${PORT}
API 文档:
  - 登录: POST /auth/wechat-login
  - 用户信息: GET /user/info (需要 Token)
  - 更新用户: PUT /user/info (需要 Token)
  - 刷新 Token: POST /auth/refresh-token (需要 Token)
  - 登出: POST /auth/logout (需要 Token)
  - 健康检查: GET /health

环境配置:
  - APP_ID: ${WECHAT_APP_ID ? '已配置' : '未配置'}
  - APP_SECRET: ${WECHAT_APP_SECRET ? '已配置' : '未配置'}
  - JWT_SECRET: ${JWT_SECRET ? '已配置' : '未配置'}

注意：
  1. 确保在微信公众平台配置了正确的 AppID 和 AppSecret
  2. 前端请求需要添加 Authorization 头: Bearer <token>
  3. Token 有效期为 7 天
================================================================
  `)
})

module.exports = app
