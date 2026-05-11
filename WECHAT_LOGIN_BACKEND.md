/*
 * 微信登录 API 集成文档
 * 
 * 本文档描述如何在后端实现微信小程序登录功能
 */

/**
 * 微信登录流程说明
 * 
 * 1. 前端流程：
 *    - 用户点击授权按钮
 *    - 调用 wx.login() 获取临时登录凭证 code
 *    - 输入昵称并生成首字头像
 *    - 调用 wx.getPhoneNumber() 获取加密的手机号
 *    - 将 code、encryptedData、iv、userInfo 发送到后端
 * 
 * 2. 后端流程：
 *    - 接收前端发送的 code、encryptedData、iv、userInfo
 *    - 使用 code 调用微信 API 获取 session_key 和 openid
 *    - 使用 session_key 解密 encryptedData（手机号和用户信息）
 *    - 保存用户信息到数据库
 *    - 生成 JWT token 返回给前端
 *    - 前端保存 token 用于后续请求认证
 */

// ============================================
// 后端 API 实现示例 (Node.js + Express)
// ============================================

/**
 * 1. 微信登录 API
 * POST /auth/wechat-login
 * 
 * 请求参数：
 * {
 *   code: "string",              // wx.login() 返回的临时登录凭证
 *   encryptedData: "string",     // wx.getPhoneNumber() 返回的加密数据
 *   iv: "string",                // 加密数据的初始向量
 *   userInfo: {                  // 用户昵称信息
 *     nickName: "string",        // 用户昵称
 *     avatarText: "string",      // 用户昵称首字头像文本
 *     gender: 0|1|2,             // 0=未知,1=男,2=女
 *     province: "string",
 *     city: "string",
 *     country: "string"
 *   }
 * }
 * 
 * 响应格式：
 * {
 *   code: 0,
 *   msg: "登录成功",
 *   data: {
 *     token: "jwt_token",
 *     userId: "user_id",
 *     nickname: "用户昵称",
 *     phone: "联系电话",
 *     avatarText: "昵称首字",
 *     createdAt: "ISO时间戳",
 *     sessionKey: "session_key"  // 用于后续解密用户数据
 *   }
 * }
 */

// 示例实现（使用 Node.js）
/*
const express = require('express')
const axios = require('axios')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const app = express()

// 微信配置
const WECHAT_CONFIG = {
  appId: 'your_app_id',           // 在微信开发者后台获取
  appSecret: 'your_app_secret'    // 在微信开发者后台获取
}

// JWT 密钥
const JWT_SECRET = 'your_jwt_secret_key'

// 解密函数
function decrypt(encryptedData, sessionKey, iv) {
  try {
    const encrypted = Buffer.from(encryptedData, 'base64')
    const key = Buffer.from(sessionKey, 'base64')
    const vector = Buffer.from(iv, 'base64')
    
    const cipher = crypto.createDecipheriv('aes-128-cbc', key, vector)
    let decrypted = cipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, cipher.final()])
    
    return JSON.parse(decrypted.toString())
  } catch (error) {
    console.error('解密失败:', error)
    return null
  }
}

// 微信登录 API
app.post('/auth/wechat-login', async (req, res) => {
  try {
    const { code, encryptedData, iv, userInfo } = req.body

    // 1. 使用 code 交换 session_key 和 openid
    const wxResponse = await axios.get(
      'https://api.weixin.qq.com/sns/jscode2session',
      {
        params: {
          appid: WECHAT_CONFIG.appId,
          secret: WECHAT_CONFIG.appSecret,
          js_code: code,
          grant_type: 'authorization_code'
        }
      }
    )

    if (wxResponse.data.errcode) {
      return res.json({
        code: 1,
        msg: '微信验证失败: ' + wxResponse.data.errmsg
      })
    }

    const { session_key, openid } = wxResponse.data
    console.log('微信返回:', { openid, session_key })

    // 2. 解密手机号（如果提供了加密数据）
    let phone = null
    if (encryptedData && iv) {
      const decryptedData = decrypt(encryptedData, session_key, iv)
      phone = decryptedData?.phoneNumber || null
      console.log('解密后的手机号:', phone)
    }

    // 3. 查询或创建用户
    let user = await User.findOne({ openid })
    
    if (!user) {
      user = await User.create({
        openid,
        nickname: userInfo.nickName,
        avatarText: userInfo.avatarText || userInfo.nickName.charAt(0),
        gender: userInfo.gender,
        province: userInfo.province,
        city: userInfo.city,
        country: userInfo.country,
        phone: phone,
        sessionKey: session_key
      })
    } else {
      // 更新用户信息
      user = await User.findByIdAndUpdate(user._id, {
        nickname: userInfo.nickName,
        avatarText: userInfo.avatarText || userInfo.nickName.charAt(0),
        gender: userInfo.gender,
        phone: phone,
        sessionKey: session_key,
        lastLoginAt: new Date()
      }, { new: true })
    }

    // 4. 生成 JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        openid: user.openid
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 5. 返回用户信息和 token
    res.json({
      code: 0,
      msg: '登录成功',
      data: {
        token,
        userId: user._id,
        nickname: user.nickname,
        phone: user.phone,
        avatarText: user.avatarText,
        createdAt: user.createdAt,
        sessionKey: session_key
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.json({
      code: 1,
      msg: '登录失败'
    })
  }
})

// 用户数据库模型示例
const userSchema = {
  openid: String,          // 微信用户的唯一标识
  nickname: String,        // 昵称
  avatarText: String,      // 昵称首字头像文本
  gender: Number,          // 性别 (0=未知, 1=男, 2=女)
  province: String,
  city: String,
  country: String,
  phone: String,           // 解密后的手机号
  sessionKey: String,      // 用于解密用户数据
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now }
}
*/

// ============================================
// 后端 API - 获取解密后的用户信息
// ============================================

/**
 * 2. 获取解密后的用户信息
 * POST /auth/decrypt-userinfo
 * 
 * 请求参数：
 * {
 *   sessionKey: "string",        // 从 wechat-login 返回的 sessionKey
 *   encryptedData: "string",     // 需要解密的数据
 *   iv: "string"                 // 加密初始向量
 * }
 * 
 * 响应格式：
 * {
 *   code: 0,
 *   msg: "解密成功",
 *   data: {
 *     // 解密后的原始数据
 *   }
 * }
 * 
 * 可用于后续获取更多用户数据，例如地理位置信息
 */

// ============================================
// 后端 API - 微信手机号授权登录
// ============================================

/**
 * 3. 微信手机号授权登录
 * POST /auth/wechat-phone-login
 * 
 * 请求参数：
 * {
 *   code: "string",              // wx.login() 返回的临时登录凭证
 *   encryptedData: "string",     // 来自 button getPhoneNumber 的加密数据
 *   iv: "string"                 // 加密数据的初始向量
 * }
 * 
 * 响应格式：
 * {
 *   code: 0,
 *   msg: "登录成功",
 *   data: {
 *     token: "jwt_token",
 *     phone: "联系电话",
 *     // ... 其他用户信息
 *   }
 * }
 */

// ============================================
// 微信 API 参考
// ============================================

/**
 * 关键 API 说明：
 * 
 * 1. wx.login()
 *    - 获取临时登录凭证 (code)
 *    - code 有效期 5 分钟
 *    - 每次调用返回不同的 code
 * 
 * 2. 昵称输入
 *    - 获取用户昵称
 *    - 不需要头像权限
 *    - 前端根据昵称首字生成 avatarText
 * 
 * 3. wx.getPhoneNumber()
 *    - 获取用户的真实手机号
 *    - 需要用户主动授权
 *    - 返回 encryptedData 和 iv（加密）
 * 
 * 4. 微信服务端 API：code2session
 *    - URL: https://api.weixin.qq.com/sns/jscode2session
 *    - 使用 code 和 app_secret 换取 session_key 和 openid
 *    - 获得的 session_key 用于解密用户数据
 */

// ============================================
// 加密数据解密参考
// ============================================

/**
 * 微信小程序使用 AES-128-CBC 加密算法：
 * - 密钥：本次登录的 session_key (base64 编码)
 * - 初始向量：getPhoneNumber/getUserInfo 返回的 iv (base64 编码)
 * - 加密数据：getPhoneNumber/getUserInfo 返回的 encryptedData (base64 编码)
 * 
 * 解密步骤：
 * 1. 将 session_key、iv、encryptedData 从 base64 解码为二进制
 * 2. 使用 openssl 或加密库（如 crypto-js）进行 AES-128-CBC 解密
 * 3. 解密后得到 JSON 字符串，解析得到用户数据
 * 
 * 常见的用户数据结构：
 * {
 *   "nickName": "用户昵称",
 *   "gender": 1,           // 1=男, 2=女, 0=未知
 *   "language": "zh_CN",
 *   "city": "城市",
 *   "province": "省份",
 *   "country": "国家",
 *   "avatarText": "昵"
 * }
 * 
 * 手机号数据结构：
 * {
 *   "phoneNumber": "13800138000"
 * }
 */

// ============================================
// 环境变量配置示例
// ============================================

/**
 * .env 文件配置：
 * 
 * WECHAT_APP_ID=your_app_id
 * WECHAT_APP_SECRET=your_app_secret
 * JWT_SECRET=your_jwt_secret
 * 
 * 在微信公众平台获取：
 * https://mp.weixin.qq.com/wxamp/basicprofile/index
 * - AppID: 小程序的 AppID
 * - AppSecret: 小程序的 AppSecret（需要妥善保管，不要传到前端）
 */

// ============================================
// 安全建议
// ============================================

/**
 * 1. 密钥管理
 *    - AppSecret 必须存储在后端，不能暴露给前端
 *    - JWT_SECRET 也必须安全存储
 *    - 使用环境变量管理敏感信息
 * 
 * 2. Token 管理
 *    - 使用 JWT 并设置适当的过期时间
 *    - 前端可以在退出或 Token 过期时重新登录
 *    - 可以实现 Token 刷新机制
 * 
 * 3. 数据安全
 *    - 所有用户数据必须在后端解密后才能使用
 *    - 手机号等敏感信息应加密存储
 *    - 使用 HTTPS 保护传输中的数据
 * 
 * 4. 请求验证
 *    - 验证请求来源（域名白名单）
 *    - 使用 CORS 限制跨域请求
 *    - 实现请求速率限制防止暴力破解
 * 
 * 5. 错误处理
 *    - 不要将敏感错误信息暴露给客户端
 *    - 记录详细的错误日志用于排查问题
 *    - 返回统一的错误响应格式
 */

// ============================================
// 测试流程
// ============================================

/**
 * 1. 本地开发测试：
 *    - 使用微信开发者工具
 *    - 在开发者工具中配置本地后端地址
 *    - 点击授权按钮进行测试
 * 
 * 2. 生产环境检查：
 *    - 确保小程序在微信平台已发布
 *    - 后端 API 使用 HTTPS
 *    - AppID 和 AppSecret 已正确配置
 *    - 数据库连接正常
 * 
 * 3. 常见问题：
 *    - code 过期：5 分钟内需要使用 code 交换 session_key
 *    - session_key 过期：用户下次登录时会获得新的 session_key
 *    - 解密失败：检查 session_key、encryptedData、iv 是否对应
 */

module.exports = {
  // 本文档仅提供参考实现
  // 实际部署时需要根据具体的后端框架进行调整
}
