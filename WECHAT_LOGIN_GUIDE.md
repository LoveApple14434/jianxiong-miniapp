# 微信小程序登录功能集成指南

## 概述

本指南说明如何在健雄书韵小程序中使用微信原生登录功能，这是目前最符合微信生态的登录方式。

## 登录流程图

```
用户点击授权按钮
    ↓
wx.login() 获取 code
    ↓
输入昵称并生成首字头像
    ↓
wx.getPhoneNumber() 获取加密的手机号
    ↓
发送 code + encryptedData + iv 到后端
    ↓
后端调用微信 API 验证 code，获取 session_key 和 openid
    ↓
后端解密手机号和用户信息
    ↓
后端创建/更新用户，生成 JWT token
    ↓
返回 token 和用户信息给前端
    ↓
前端保存 token，跳转到首页
```

## 前端实现说明

### 1. 登录页面流程

#### 授权检查
```javascript
// 页面加载时检查授权状态
onLoad() {
  wx.getSetting({
    success: (res) => {
      // 检查是否已授权
      const userInfoAuth = res.authSetting['scope.userInfo']
      const phoneAuth = res.authSetting['scope.phoneNumber']
    }
  })
}
```

#### 昵称输入
```javascript
// 监听昵称输入
onNicknameBlur(e) {
  const nickName = e.detail.value
  this.setData({ nickName })
}
```

#### 手机号授权
```javascript
// 处理 getPhoneNumber 授权
onGetPhoneNumber(e) {
  if (e.detail.errMsg === 'getPhoneNumber:ok') {
    const { encryptedData, iv } = e.detail
    // 保存加密数据
    this.setData({ encryptedData, iv })
  }
}
```

#### 执行登录
```javascript
async performLogin() {
  // 1. 获取 code
  const code = await wx.login()
  
  // 2. 调用后端登录 API
  const response = await authAPI.wechatLogin({
    code,
    encryptedData: this.data.encryptedData,
    iv: this.data.iv,
    userInfo: this.data.userInfoFromWeChat
  })
  
  // 3. 保存 token 和用户信息
  wx.setStorageSync('userInfo', response.data)
  wx.setStorageSync('token', response.data.token)
  
  // 4. 跳转到首页
  wx.reLaunch({ url: '/pages/index/index' })
}
```

### 2. 其他页面的登录检查

```javascript
Page({
  onShow() {
    const app = getApp()
    
    // 检查是否已登录
    if (!app.isUserLogin()) {
      // 未登录，跳转到登录页
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    
    // 已登录，继续正常流程
  }
})
```

### 3. 发送认证请求

所有需要认证的 API 请求都会自动添加 Authorization 头：

```javascript
const util = require('../utils/util.js')

// 自动添加 Authorization: Bearer token
util.request({
  url: 'https://api.example.com/user/info',
  method: 'GET'
}).then(data => {
  console.log('用户数据:', data)
}).catch(error => {
  if (error.message.includes('401')) {
    // token 过期，自动登出
    const app = getApp()
    app.logout()
  }
})
```

## 后端实现说明

### 1. 微信登录 API 端点

**URL**: `POST /auth/wechat-login`

**请求体**:
```json
{
  "code": "wx.login() 返回的临时登录凭证",
  "encryptedData": "wx.getPhoneNumber() 返回的加密数据",
  "iv": "加密初始向量",
  "userInfo": {
    "nickName": "用户昵称",
    "avatarText": "昵称首字",
    "gender": 1,
    "province": "省份",
    "city": "城市",
    "country": "国家"
  }
}
```

**响应体**:
```json
{
  "code": 0,
  "msg": "登录成功",
  "data": {
    "token": "JWT token",
    "userId": "用户 ID",
    "nickname": "用户昵称",
    "phone": "解密后的手机号",
      "avatarText": "昵称首字",
    "createdAt": "账户创建时间",
    "sessionKey": "用于后续解密的会话密钥"
  }
}
```

### 2. 后端关键实现步骤

#### 步骤 1: 使用 code 交换 session_key 和 openid

```javascript
const wxResponse = await axios.get(
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

const { session_key, openid } = wxResponse.data
```

#### 步骤 2: 解密手机号

```javascript
function decrypt(encryptedData, sessionKey, iv) {
  const encrypted = Buffer.from(encryptedData, 'base64')
  const key = Buffer.from(sessionKey, 'base64')
  const vector = Buffer.from(iv, 'base64')
  
  const cipher = crypto.createDecipheriv('aes-128-cbc', key, vector)
  let decrypted = cipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, cipher.final()])
  
  return JSON.parse(decrypted.toString().utf8)
}

const phoneData = decrypt(encryptedData, session_key, iv)
const phone = phoneData.phoneNumber
```

#### 步骤 3: 保存用户信息

```javascript
let user = await User.findOne({ openid })

if (!user) {
  user = await User.create({
    openid,
    nickname: userInfo.nickName,
    avatarText: userInfo.avatarText || userInfo.nickName.charAt(0),
    gender: userInfo.gender,
    phone: phone,
    sessionKey: session_key
  })
}
```

#### 步骤 4: 生成 JWT Token

```javascript
const token = jwt.sign(
  {
    userId: user._id,
    openid: user.openid
  },
  JWT_SECRET,
  { expiresIn: '7d' }
)
```

### 3. 数据库用户表设计

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | ObjectId | 用户唯一ID |
| openid | String | 微信用户唯一标识 |
| nickname | String | 用户昵称 |
| avatarText | String | 昵称首字头像文本 |
| phone | String | 电话号码（解密后） |
| gender | Number | 性别 (0=未知, 1=男, 2=女) |
| province | String | 省份 |
| city | String | 城市 |
| country | String | 国家 |
| sessionKey | String | 微信会话密钥 |
| createdAt | Date | 账户创建时间 |
| lastLoginAt | Date | 最后登录时间 |

## 配置步骤

### 1. 微信公众平台配置

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入"开发"->"开发管理"->"开发设置"
3. 获取 AppID 和 AppSecret
4. 配置后端服务器地址（用于接收微信服务器的请求）

### 2. 后端配置

创建 `.env` 文件：
```env
WECHAT_APP_ID=your_app_id_from_wechat_platform
WECHAT_APP_SECRET=your_app_secret_from_wechat_platform
JWT_SECRET=your_jwt_secret_for_token_generation
API_BASE_URL=https://api.example.com
```

### 3. 前端配置

修改 `services/api.js`:
```javascript
const API_BASE_URL = 'https://api.example.com'  // 改为实际地址
```

## 测试登录流程

### 1. 使用微信开发者工具测试

1. 打开微信开发者工具
2. 扫码登录
3. 配置本地服务器地址：工具栏 -> 设置 -> 项目设置 -> 本地设置
4. 在登录页面点击授权按钮进行测试

### 2. 预期行为

- ✅ 点击"授权用户信息"按钮 → 弹出授权确认 → 显示用户头像和昵称
- ✅ 点击"授权手机号"按钮 → 弹出授权确认 → 显示授权状态
- ✅ 两个都授权后 → "开始使用"按钮可用
- ✅ 点击"开始使用" → 显示登录中 → 跳转到首页
- ✅ 再次进入小程序 → 自动登录，直接显示首页

## 常见问题

### Q1: code 无效或过期
- code 的有效期是 5 分钟
- 每次 wx.login() 都会返回新的 code
- 需要立即使用 code 交换 session_key

### Q2: 解密失败
- 确保 sessionKey、encryptedData、iv 都是正确的
- 检查 base64 解码是否正确
- 确认使用的是 AES-128-CBC 算法

### Q3: 昵称无法保存
- 确认输入框的绑定和 `type="nickname"` 配置正确
- 检查登录页是否将昵称回填到预览区域
- 确保在真实设备或开发者工具中测试

### Q4: 手机号为空
- 用户没有授权手机号获取
- encryptedData 或 iv 为 undefined
- 需要用户重新授权

### Q5: Token 过期怎么办?
- 前端检查到 401 错误时自动跳转到登录页
- 用户重新授权后获取新的 token
- 可以实现 Token 刷新机制来改善用户体验

## 安全最佳实践

1. **AppSecret 保密**
   - 不要在前端代码中包含 AppSecret
   - 只在后端服务器中使用

2. **HTTPS 传输**
   - 所有 API 请求必须使用 HTTPS
   - 保护用户数据不被中间人攻击

3. **Token 管理**
   - 设置合理的 Token 过期时间（建议 7 天）
   - 使用 JWT 保证 Token 的完整性
   - 考虑实现 Token 黑名单机制

4. **错误处理**
   - 不要将敏感错误信息暴露给前端
   - 记录详细的服务器日志用于调试
   - 实现请求速率限制防止暴力破解

5. **数据验证**
   - 在后端验证所有输入数据
   - 检查 code、encryptedData、iv 的有效性
   - 验证用户信息的完整性

## 相关文件

- [登录页面代码](./pages/login/login.js)
- [登录页面模板](./pages/login/login.wxml)
- [API 服务模块](./services/api.js)
- [后端实现参考](./WECHAT_LOGIN_BACKEND.md)
- [工具函数](./utils/util.js)

## 参考资源

- [微信小程序官方文档 - 登录](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html)
- [微信小程序官方文档 - 输入框](https://developers.weixin.qq.com/miniprogram/dev/component/input.html)
- [微信小程序官方文档 - 手机号](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/phonenumber/index.html)
- [微信开放平台 - code2session](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/code2Session.html)

## 下一步

1. ✅ 前端登录页面已完成
2. 📝 后端登录 API 需要实现
3. 📝 数据库用户模型需要创建
4. 📝 JWT Token 验证中间件需要实现
5. 📝 其他业务 API 需要添加认证

完成这些步骤后，你就有了一个完整的、符合微信生态的登录系统！
