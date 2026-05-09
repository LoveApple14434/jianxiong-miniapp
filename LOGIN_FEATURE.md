# 登录功能文档

## 功能概述

为健雄书韵小程序开发的完整登录功能，包含以下特性：

- ✅ 手机号 + 密码登录
- ✅ 登录状态管理
- ✅ 本地存储与恢复
- ✅ 记住密码功能
- ✅ 登出功能
- ✅ Token 管理
- ✅ 网络请求拦截器
- ✅ 登录状态检查

## 新增文件

### 页面文件
- `pages/login/login.js` - 登录页面逻辑
- `pages/login/login.json` - 登录页面配置
- `pages/login/login.wxml` - 登录页面模板
- `pages/login/login.wxss` - 登录页面样式

### 服务文件
- `services/api.js` - API 服务模块

## 修改的文件

### app.js
添加了用户信息和登录状态管理：
- `globalData.userInfo` - 存储用户信息
- `globalData.token` - 存储认证 Token
- `globalData.isLogin` - 登录状态标志
- `checkLoginStatus()` - 检查登录状态
- `isUserLogin()` - 获取登录状态
- `getUserInfo()` - 获取用户信息
- `getToken()` - 获取 Token
- `setLoginInfo()` - 设置登录信息
- `logout()` - 登出方法

### app.json
- 将登录页面添加到页面列表中
- 设置为启动页面（第一个页面）

### utils/util.js
添加了以下工具函数：
- `validatePhone()` - 验证手机号格式
- `validatePassword()` - 验证密码强度
- `validateEmail()` - 验证邮箱格式
- `isUserLogin()` - 检查登录状态
- `getLoginInfo()` - 获取登录信息
- `setLoginInfo()` - 设置登录信息
- `logout()` - 登出
- `checkPageLogin()` - 页面登录检查装饰器
- `request()` - 网络请求拦截器（自动添加 Token）

### pages/index/index.js
- 添加登录状态检查

### pages/profile/profile.js
- 添加用户信息显示
- 添加登出功能

### pages/profile/profile.wxml
- 显示动态用户信息
- 添加登出按钮

### pages/profile/profile.wxss
- 添加登出按钮样式

## 使用方法

### 1. 启动应用
当用户第一次打开小程序时，会自动跳转到登录页面。

```javascript
// app.js 中会自动检查登录状态
app.onLaunch() {
  this.checkLoginStatus()
}
```

### 2. 登录
用户在登录页面输入手机号和密码，勾选"记住密码"后点击登录。

```javascript
// pages/login/login.js
onLogin() {
  // 验证表单
  // 调用登录 API
  // 保存用户信息和 Token
  // 重定向到首页
}
```

### 3. 登出
用户可以在个人中心页面点击"登出"按钮退出登录。

```javascript
// pages/profile/profile.js
onLogout() {
  app.logout()
}
```

### 4. 在其他页面中检查登录状态
```javascript
// 在 onShow 中检查登录状态
onShow() {
  const app = getApp()
  if (!app.isUserLogin()) {
    wx.reLaunch({ url: '/pages/login/login' })
    return
  }
  // 页面逻辑
}
```

### 5. 使用网络请求拦截器
```javascript
// 使用 util.request() 会自动添加 Token
const util = require('../utils/util.js')

util.request({
  url: 'https://api.example.com/books',
  method: 'GET'
}).then(data => {
  console.log(data)
}).catch(error => {
  console.error(error)
})
```

## API 服务模块

`services/api.js` 提供了统一的 API 调用接口：

### 认证 API
```javascript
const { authAPI } = require('../services/api.js')

// 登录
authAPI.login(phone, password)

// 注册
authAPI.register(data)

// 发送验证码
authAPI.sendVerifyCode(phone)

// 用户信息
authAPI.getUserInfo()
authAPI.updateUserInfo(data)

// 修改密码
authAPI.changePassword(oldPassword, newPassword)

// 忘记密码
authAPI.resetPassword(phone, code, newPassword)

// 登出
authAPI.logout()
```

### 其他 API
```javascript
const { bookAPI, noteAPI } = require('../services/api.js')

// 书籍 API
bookAPI.getBooks()
bookAPI.getBookDetail(bookId)

// 笔记 API
noteAPI.getNotes()
noteAPI.createNote(data)
noteAPI.updateNote(noteId, data)
noteAPI.deleteNote(noteId)
```

## 数据存储

登录信息存储在本地缓存中：
```javascript
// 用户信息
wx.getStorageSync('userInfo')

// Token
wx.getStorageSync('token')

// 记住的手机号
wx.getStorageSync('savedPhone')

// 记住的密码（建议加密存储）
wx.getStorageSync('savedPassword')
```

## 配置 API 地址

修改 `services/api.js` 中的 `API_BASE_URL` 为实际的 API 服务器地址：

```javascript
const API_BASE_URL = 'https://your-api-server.com'
```

## 安全建议

1. **密码加密** - 建议在发送密码前进行加密
2. **HTTPS** - 确保所有 API 请求都使用 HTTPS
3. **Token 过期处理** - 实现 Token 刷新机制
4. **密码存储** - 如果要保存密码，建议进行加密
5. **安全验证** - 在服务器端进行完整的身份验证

## 测试

### 登录测试数据
当前实现使用模拟数据，实际使用时需要连接真实 API：
- 手机号：任意 1 开头的 11 位数字
- 密码：至少 6 位

### 模拟登录流程
1. 打开小程序
2. 输入手机号（如：18812345678）
3. 输入密码（如：123456）
4. 勾选"记住密码"
5. 点击登录
6. 成功后跳转到首页

## 下一步开发建议

1. **微信授权登录** - 添加微信一键登录功能
2. **验证码登录** - 实现短信验证码登录
3. **忘记密码** - 创建忘记密码页面
4. **注册功能** - 完善用户注册流程
5. **用户信息编辑** - 允许用户编辑个人资料
6. **账号安全** - 添加二次验证、设备绑定等功能
