#!/bin/bash
#
# 登录功能快速开始指南
# 这是一个快速参考文档，帮助开发者快速集成登录功能
#

## 项目结构

项目现在包含以下新增和修改的部分：

```
jianxiong-miniapp/
├── app.js                      # ← 修改：添加登录状态管理
├── app.json                    # ← 修改：添加登录页面
├── pages/
│   ├── login/                  # ← 新增：登录页面
│   │   ├── login.js
│   │   ├── login.json
│   │   ├── login.wxml
│   │   └── login.wxss
│   ├── index/                  # ← 修改：添加登录检查
│   ├── profile/                # ← 修改：显示用户信息和登出
│   └── ...其他页面
├── services/
│   └── api.js                  # ← 新增：API 服务模块
├── utils/
│   └── util.js                 # ← 修改：添加认证工具函数
└── LOGIN_FEATURE.md            # ← 新增：详细文档
```

## 快速集成步骤

### 第1步：连接真实 API
编辑 `services/api.js`，修改 API 基础地址：

```javascript
const API_BASE_URL = 'https://your-api-server.com'
```

### 第2步：修改登录逻辑
编辑 `pages/login/login.js` 中的 `onLogin()` 方法，将模拟 API 调用替换为真实 API 调用：

```javascript
// 替换这部分：
// const response = await new Promise((resolve) => {
//   setTimeout(() => {
//     resolve({ ... })
//   }, 1500)
// })

// 改为：
const { authAPI } = require('../../services/api.js')
const response = await authAPI.login(this.data.phone, this.data.password)
```

### 第3步：验证登录流程
1. 编译并运行项目
2. 打开小程序，应该看到登录页面
3. 输入测试账户信息
4. 点击登录，应该成功跳转到首页

### 第4步：在其他页面中使用用户信息
```javascript
// 在任何页面中获取当前用户信息
const app = getApp()
const userInfo = app.getUserInfo()
const token = app.getToken()
const isLogin = app.isUserLogin()
```

## 常见任务

### 添加登录检查到其他页面
```javascript
onShow() {
  const app = getApp()
  if (!app.isUserLogin()) {
    wx.reLaunch({ url: '/pages/login/login' })
    return
  }
  // 你的页面逻辑
}
```

### 发送带有 Token 的请求
```javascript
const util = require('../utils/util.js')

util.request({
  url: 'https://api.example.com/user/info',
  method: 'GET'
}).then(data => {
  console.log('用户信息:', data)
}).catch(error => {
  console.error('请求失败:', error)
})
```

### 访问用户信息
```javascript
const app = getApp()
const userInfo = app.getUserInfo()

console.log('用户昵称:', userInfo.nickname)
console.log('用户手机号:', userInfo.phone)
console.log('用户ID:', userInfo.userId)
```

### 执行登出
```javascript
const app = getApp()
app.logout()
// 自动跳转到登录页面
```

## 登录页面功能

- ✅ 手机号输入（验证格式）
- ✅ 密码输入（可切换显示/隐藏）
- ✅ 记住密码（保存到本地）
- ✅ 忘记密码链接（准备就绪）
- ✅ 立即注册链接（准备就绪）
- ✅ 登录状态检查（自动重定向）

## Token 和认证

Token 会自动添加到所有 API 请求中：

```javascript
// 在 util.js 中自动处理
header: {
  'Authorization': `Bearer ${token}`
}
```

如果 Token 过期（返回 401），用户会自动登出。

## 存储的数据

所有用户相关的数据都存储在设备本地：

```javascript
// 用户信息
wx.getStorageSync('userInfo')
// {
//   token: 'xxx',
//   userId: 'xxx',
//   nickname: '用户名',
//   phone: '18812345678',
//   avatarText: '用',
//   createdAt: '2024-01-01T...'
// }

// 记住的手机号
wx.getStorageSync('savedPhone')

// 记住的密码（已存储）
wx.getStorageSync('savedPassword')
```

## 调试建议

### 查看登录状态
在微信开发者工具的控制台输入：
```javascript
const app = getApp()
console.log(app.globalData)
```

### 查看本地存储
在微信开发者工具中：
- 打开 "Storage" 标签
- 查看 "LocalStorage" 中的数据

### 模拟网络错误
修改 `pages/login/login.js` 中的 `onLogin()` 来测试错误处理

## 下一步

1. 连接真实 API 服务器
2. 添加微信授权登录
3. 实现验证码登录
4. 创建注册页面
5. 创建忘记密码页面
6. 添加更多的安全验证

## 相关文件

- [详细功能文档](./LOGIN_FEATURE.md)
- [登录页面代码](./pages/login/login.js)
- [API 服务模块](./services/api.js)
- [工具函数](./utils/util.js)
- [App 全局配置](./app.js)

## 获取帮助

如遇问题，检查以下几点：

1. ✅ API_BASE_URL 是否已配置
2. ✅ Token 是否正确存储
3. ✅ 登录状态检查是否正确实现
4. ✅ 网络请求是否包含正确的 Authorization 头

---

祝你开发顺利！🚀
