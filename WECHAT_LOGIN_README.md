# 🔐 微信小程序登录系统 - 完整实现

## 📌 项目概述

为**健雄书韵**微信小程序实现了基于**微信原生 API** 的完整登录系统。这是最符合微信生态习惯、最安全、最用户友好的登录方案。

## 🎯 核心特性

✅ **微信原生认证**
- 使用 `wx.login()` 获取临时登录凭证
- 使用 `wx.getPhoneNumber()` 获取加密手机号

✅ **昵称首字头像**
- 登录与个人中心统一使用昵称第一个字作为头像文本
- 不再依赖微信头像权限或头像上传

✅ **完整的后端支持**
- Node.js + Express 后端示例代码
- AES-128-CBC 数据解密
- JWT Token 生成和验证

✅ **用户友好的界面**
- 直观的授权流程
- 实时显示授权状态
- 用户信息预览

✅ **生产就绪**
- 错误处理和日志记录
- 安全的 Token 管理
- 完整的 API 文档

## 📁 项目结构

```
jianxiong-miniapp/
├── 📄 前端文件
│   ├── app.js                      # 全局配置（已更新）
│   ├── app.json                    # 应用配置（已更新）
│   │
│   ├── pages/
│   │   ├── login/                  # 登录页面
│   │   │   ├── login.js           # 登录逻辑
│   │   │   ├── login.json         # 页面配置
│   │   │   ├── login.wxml         # 页面模板
│   │   │   └── login.wxss         # 页面样式
│   │   │
│   │   ├── index/                 # 首页（已更新）
│   │   ├── profile/               # 个人中心（已更新）
│   │   └── ...其他页面
│   │
│   ├── services/
│   │   └── api.js                 # API 服务模块（已更新）
│   │
│   └── utils/
│       └── util.js                # 工具函数（已更新）
│
├── 📄 后端文件
│   ├── backend-example.js         # Node.js 后端完整实现
│   ├── .env.example               # 环境变量模板
│   └── package.json               # npm 依赖配置（参考）
│
├── 📖 文档
│   ├── WECHAT_LOGIN_GUIDE.md      # 前端集成指南
│   ├── WECHAT_LOGIN_BACKEND.md    # 后端实现参考
│   ├── DEPLOYMENT_GUIDE.md        # 部署指南
│   ├── LOGIN_FEATURE.md           # 功能文档（V1 - 旧版）
│   └── QUICK_START_LOGIN.md       # 快速开始（V1 - 旧版）
│
└── project.config.json            # 小程序项目配置
```

## 🔄 登录流程

### 前端用户交互
```
1. 用户打开小程序
   ↓
2. 检查是否已登录
   - 是 → 跳转到首页
   - 否 → 显示登录页面
   ↓
3. 用户点击"授权用户信息"
   - 弹出微信授权确认
  - 输入昵称并自动生成首字头像
   ↓
4. 用户点击"授权手机号"
   - 弹出微信授权确认
   - 显示授权状态
   ↓
5. 用户点击"开始使用"
   - 调用 wx.login() 获取 code
   - 发送 code 和授权数据到后端
   ↓
6. 后端验证并返回 Token
   - 前端保存 Token
   - 跳转到首页
```

### 后端处理流程
```
1. 接收 code + encryptedData + iv
   ↓
2. 使用 code 调用微信 API
   - 获取 session_key 和 openid
   ↓
3. 使用 session_key 解密手机号
   ↓
4. 查询或创建用户
   - 根据 openid 识别用户
   - 保存用户信息到数据库
   ↓
5. 生成 JWT Token
   ↓
6. 返回 Token 和用户信息
```

## 📝 API 文档

### 前端调用

#### 1. 授权用户信息
```javascript
// 此操作由 button 自动触发
<button open-type="getUserInfo" bindgetuserinfo="onGetUserInfo">
  授权用户信息
</button>

// 处理函数
onGetUserInfo(e) {
  const userInfo = e.detail.userInfo  // 获得用户信息
}
```

#### 2. 授权手机号
```javascript
// 此操作由 button 自动触发
<button open-type="getPhoneNumber" bindgetphonenumber="onGetPhoneNumber">
  授权手机号
</button>

// 处理函数
onGetPhoneNumber(e) {
  const { encryptedData, iv } = e.detail  // 获得加密的手机号
}
```

#### 3. 登录请求
```javascript
const { authAPI } = require('../../services/api.js')

const response = await authAPI.wechatLogin({
  code: 'wx.login() 返回的 code',
  encryptedData: '手机号加密数据',
  iv: '加密初始向量',
  userInfo: { /* 用户信息 */ }
})
```

### 后端 API

#### 登录
```
POST /auth/wechat-login

请求：
{
  "code": "string",
  "encryptedData": "string",
  "iv": "string",
  "userInfo": {
    "nickName": "string",
    "avatarText": "string",
    "gender": 0|1|2
  }
}

响应 (成功):
{
  "code": 0,
  "msg": "登录成功",
  "data": {
    "token": "JWT token",
    "userId": "user id",
    "nickname": "昵称",
    "phone": "联系电话",
    "avatarText": "昵称首字",
    "createdAt": "ISO 时间戳"
  }
}

响应 (失败):
{
  "code": 1,
  "msg": "错误信息"
}
```

#### 获取用户信息
```
GET /user/info

请求头：
Authorization: Bearer <token>

响应：
{
  "code": 0,
  "msg": "获取成功",
  "data": {
    "userId": "string",
    "nickname": "string",
    "avatarText": "string",
    "phone": "string",
    "gender": 0|1|2
  }
}
```

#### 其他 API
- POST `/user/info` - 更新用户信息
- POST `/auth/refresh-token` - 刷新 Token
- POST `/auth/logout` - 登出
- GET `/health` - 健康检查

## 🚀 快速开始

### 前端配置

1. **配置 API 地址**
```javascript
// 修改 services/api.js
const API_BASE_URL = 'https://your-api-server.com'
```

2. **编译并运行**
```bash
# 使用微信开发者工具
# 1. 打开项目
# 2. 点击编译
# 3. 在模拟器中测试
```

### 后端部署

1. **初始化项目**
```bash
mkdir backend
cd backend
npm init -y
npm install express axios crypto jsonwebtoken cors dotenv
```

2. **配置环境**
```bash
cp .env.example .env
# 编辑 .env，填入微信配置
```

3. **启动服务**
```bash
cp backend-example.js app.js
node app.js
```

4. **测试登录**
```bash
# 在微信开发者工具中点击授权按钮
# 查看控制台日志
```

## 🔐 安全考虑

### 必须做的事情
1. ✅ 将 AppSecret 存储在后端环境变量中
2. ✅ 使用 HTTPS 传输所有数据
3. ✅ 验证所有来自前端的请求
4. ✅ 在后端解密用户数据，不要在前端解密
5. ✅ 实施请求速率限制防止暴力攻击
6. ✅ 设置合理的 Token 过期时间

### 不要做的事情
1. ❌ 不要在前端代码中暴露 AppSecret
2. ❌ 不要在日志中打印敏感信息
3. ❌ 不要跳过 HTTPS 验证
4. ❌ 不要信任前端发送的用户信息
5. ❌ 不要使用过长的 Token 过期时间

## 🧪 测试检查清单

- [ ] 确保微信开发者工具能启动项目
- [ ] 点击"授权用户信息"，看到用户头像和昵称
- [ ] 点击"授权手机号"，看到授权状态
- [ ] 点击"开始使用"，看到登录加载动画
- [ ] 成功登录后跳转到首页
- [ ] 关闭并重新打开小程序，自动跳到首页
- [ ] 在个人中心看到用户信息
- [ ] 点击登出，确认返回登录页
- [ ] 在开发者工具 Console 中查看网络请求
- [ ] 后端服务器的日志显示正确的请求和响应

## 📚 文档导航

| 文档 | 用途 | 读者 |
|------|------|------|
| [WECHAT_LOGIN_GUIDE.md](./WECHAT_LOGIN_GUIDE.md) | 完整的登录流程说明 | 所有开发者 |
| [WECHAT_LOGIN_BACKEND.md](./WECHAT_LOGIN_BACKEND.md) | 后端实现参考 | 后端开发者 |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | 部署步骤 | 运维/全栈 |
| [backend-example.js](./backend-example.js) | Node.js 完整实现 | 后端开发者 |
| [.env.example](./.env.example) | 环境变量配置 | 后端部署 |

## ❓ 常见问题

**Q: 为什么选择微信原生登录？**
A: 这是目前最符合微信生态的方案，用户体验最好，安全性最高。

**Q: 支持其他登录方式吗？**
A: 可以。你可以在后端添加其他登录方式，如手机号密码、QQ 登录等。

**Q: 如何处理 Token 过期？**
A: 前端检查到 401 错误时自动重新登录，或者实现 Token 刷新机制。

**Q: 手机号解密失败怎么办？**
A: 检查 session_key、encryptedData、iv 是否对应，确保 AES-128-CBC 算法正确。

**Q: 如何更新用户信息？**
A: 调用 PUT `/user/info` API，需要传递 Token。

## 🎓 学习资源

- [微信小程序 wx.login() 文档](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html)
- [微信小程序授权文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/)
- [微信 code2session API](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/code2Session.html)
- [JWT 介绍](https://jwt.io/)
- [Node.js Crypto 模块](https://nodejs.org/api/crypto.html)

## 📞 技术支持

遇到问题？

1. 📖 查阅相关文档
2. 🔍 检查服务器日志
3. 🐛 使用微信开发者工具调试
4. 🔗 查看控制台错误信息

---

**最后更新**: 2024 年
**版本**: 2.0 (微信原生登录)
**状态**: 生产就绪 ✅

