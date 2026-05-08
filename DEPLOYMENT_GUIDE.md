# 微信登录功能 - 快速部署指南

## 📋 概述

这是为健雄书韵小程序实现的基于微信原生 API 的登录系统。

## 🚀 快速开始

### 前端部分（微信小程序）

#### 1. 项目文件

已完成的前端文件：
- ✅ `pages/login/login.js` - 登录页面逻辑
- ✅ `pages/login/login.wxml` - 登录页面 UI
- ✅ `pages/login/login.wxss` - 登录页面样式
- ✅ `services/api.js` - API 服务模块
- ✅ `utils/util.js` - 工具函数（已更新）
- ✅ `app.js` - 应用全局配置（已更新）

#### 2. 配置 API 地址

修改 `services/api.js` 第 5 行：

```javascript
const API_BASE_URL = 'https://your-server.com'  // 改为你的后端地址
```

#### 3. 首次运行

1. 使用微信开发者工具打开项目
2. 编译并运行
3. 点击授权按钮进行授权
4. 点击"开始使用"开始登录

### 后端部分（Node.js + Express）

#### 1. 初始化项目

```bash
# 创建后端项目目录
mkdir backend
cd backend

# 初始化 npm 项目
npm init -y
```

#### 2. 安装依赖

```bash
npm install express axios crypto jsonwebtoken cors dotenv
# 如果使用 MongoDB
npm install mongoose
```

#### 3. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入微信配置：

```env
WECHAT_APP_ID=wxb123456789abcdef
WECHAT_APP_SECRET=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
JWT_SECRET=your_very_long_and_random_secret_key_min_32_chars
PORT=3000
NODE_ENV=development
```

#### 4. 复制 API 实现

复制 `backend-example.js` 文件到你的后端项目中，改名为 `app.js` 或 `index.js`：

```bash
cp backend-example.js app.js
```

#### 5. 启动后端服务

```bash
node app.js
```

预期输出：
```
================================================================
微信小程序登录服务已启动
================================================================
服务地址: http://localhost:3000
API 文档:
  - 登录: POST /auth/wechat-login
  - 用户信息: GET /user/info (需要 Token)
  ...
================================================================
```

## 🔧 微信公众平台配置

### 1. 获取 AppID 和 AppSecret

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入"开发" -> "开发管理" -> "开发设置"
3. 找到 AppID 和 AppSecret
4. 复制这两个值到 `.env` 文件

### 2. 配置授权域名（可选）

如果你的小程序需要在服务器上进行网络请求，需要配置合法的服务器域名：

1. 在微信公众平台的"开发设置"中
2. 添加你的服务器域名（必须是 HTTPS）
3. 上传域名验证文件（微信会提供）

## 📱 测试流程

### 使用微信开发者工具测试

1. 打开项目
2. 点击"授权用户信息"
   - 应该看到用户的头像和昵称
3. 点击"授权手机号"
   - 应该看到"已授权"状态
4. 点击"开始使用"
   - 应该看到"登录中..."加载动画
   - 然后跳转到首页
5. 关闭应用重新打开
   - 应该自动登录并显示首页

### 查看调试日志

在微信开发者工具中：
1. 打开"Console"标签
2. 查看网络请求和响应
3. 检查 Token 是否正确保存

## 🔍 常见问题

### Q: 提示"缺少 AppID"
**A:** 确保在 `.env` 文件中正确配置了 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`

### Q: 解密手机号失败
**A:** 
1. 检查 `session_key`、`encryptedData`、`iv` 是否对应
2. 确保使用的是 AES-128-CBC 算法
3. 查看服务器日志了解具体错误

### Q: Token 验证失败
**A:**
1. 检查前端是否正确添加了 Authorization 头
2. Token 格式应该是 `Bearer <token>`
3. 检查 JWT_SECRET 是否一致

### Q: 跨域请求错误
**A:**
1. 确保后端配置了 CORS
2. 确保小程序的 API 地址配置正确
3. 检查防火墙是否阻止了请求

### Q: 手机号授权后为空
**A:**
1. 用户可能没有真正授权手机号
2. encryptedData 或 iv 可能为 undefined
3. 检查浏览器开发者工具中的网络请求

## 📊 API 文档

### 登录

```
POST /auth/wechat-login

请求体：
{
  "code": "wx.login() 返回的 code",
  "encryptedData": "wx.getPhoneNumber() 返回的加密数据",
  "iv": "初始向量",
  "userInfo": { ... }
}

响应：
{
  "code": 0,
  "msg": "登录成功",
  "data": {
    "token": "JWT token",
    "userId": "用户 ID",
    "nickname": "昵称",
    ...
  }
}
```

### 获取用户信息

```
GET /user/info

请求头：
Authorization: Bearer <token>

响应：
{
  "code": 0,
  "msg": "获取成功",
  "data": { ... }
}
```

## 🔐 安全建议

1. **AppSecret 保密**
   - 只在后端使用
   - 不要提交到版本控制系统

2. **HTTPS 传输**
   - 生产环境必须使用 HTTPS
   - 保护用户数据

3. **Token 管理**
   - 设置合理的过期时间
   - 实施刷新机制

4. **输入验证**
   - 在后端验证所有输入
   - 防止注入攻击

5. **错误处理**
   - 不要暴露内部错误信息
   - 记录详细日志用于调试

## 📚 下一步

1. ✅ 前端登录页面已完成
2. ✅ 后端示例代码已提供
3. 📝 配置 AppID 和 AppSecret
4. 📝 启动后端服务
5. 📝 测试登录流程
6. 📝 连接真实数据库
7. 📝 部署到生产环境

## 📖 相关文档

- [微信登录集成指南](./WECHAT_LOGIN_GUIDE.md)
- [后端实现参考](./WECHAT_LOGIN_BACKEND.md)
- [前端代码](./pages/login/login.js)
- [后端示例代码](./backend-example.js)

## 🤝 技术支持

如需帮助：
1. 查阅微信官方文档
2. 检查服务器日志
3. 使用微信开发者工具调试
4. 查看控制台错误信息

---

祝你开发顺利！🚀
