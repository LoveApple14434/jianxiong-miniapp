# 微信登录 API 测试指南

## 📋 快速参考

### 本地测试 URL

```
基础 URL: http://localhost:3000
生产 URL: https://api.example.com
```

### 常用工具

- **Postman**: GUI 界面，简单易用
- **Curl**: 命令行工具
- **VS Code Thunder Client**: 轻量级插件
- **Insomnia**: 功能完悄的工具

## 🧪 API 测试场景

### 1. 登录 API 测试

**不使用微信直接测试**（仅用于理解流程）

```bash
# 使用 Curl
curl -X POST http://localhost:3000/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test_code_12345",
    "encryptedData": "encryptedDataBase64String",
    "iv": "ivBase64String",
    "userInfo": {
      "nickName": "测试用户",
      "avatarUrl": "https://example.com/avatar.jpg",
      "gender": 1,
      "province": "北京",
      "city": "北京",
      "country": "中国"
    }
  }'
```

**预期响应**（检查是否验证成功）：
```json
{
  "code": 1,
  "msg": "微信验证失败: ..."
}
```

> 注意：这会因为 code 无效而返回错误，这是正常的。

### 2. 获取用户信息 API 测试

**需要先从登录获得 token**

```bash
# 使用 Curl
curl -X GET http://localhost:3000/user/info \
  -H "Authorization: Bearer your_jwt_token_here"
```

**预期响应**：
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": {
    "userId": "1234567890",
    "nickname": "测试用户",
    "avatar": "https://...",
    "phone": "13800138000",
    "gender": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. 健康检查 API 测试

```bash
curl http://localhost:3000/health
```

**预期响应**：
```json
{
  "code": 0,
  "msg": "服务运行正常",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔧 使用 Postman 测试

### 1. 创建新请求

1. 打开 Postman
2. 点击 "+" 创建新页签
3. 选择请求方法（POST/GET）
4. 输入 URL

### 2. 配置请求头

| Header | Value |
|--------|-------|
| Content-Type | application/json |
| Authorization | Bearer {token} |

### 3. 配置请求体

选择 "Body" 标签，选择 "raw" 格式，选择 "JSON"：

```json
{
  "code": "test_code",
  "userInfo": {
    "nickName": "测试",
    "avatarUrl": "https://example.com/avatar.jpg",
    "gender": 1
  }
}
```

## 📱 完整的登录测试流程

### 步骤 1：启动后端服务

```bash
cd backend
npm install
node app.js
```

看到以下输出表示成功：
```
================================================================
微信小程序登录服务已启动
================================================================
服务地址: http://localhost:3000
```

### 步骤 2：测试健康检查

```bash
curl http://localhost:3000/health
```

### 步骤 3：使用微信开发者工具测试实际登录

1. 打开微信开发者工具
2. 导入你的小程序项目
3. 在登录页面点击授权按钮
4. 查看你的终端，应该看到：
   ```
   开始登录流程，code: ...
   微信验证成功，openid: ...
   创建新用户: ...
   生成 Token 成功
   ```

### 步骤 4：使用返回的 Token 测试 API

从登录响应中复制 token：

```json
{
  "code": 0,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",  // 复制这个
    "userId": "..."
  }
}
```

然后使用这个 token 调用 API：

```bash
curl http://localhost:3000/user/info \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## 🛠️ 常用的 Curl 命令

### 健康检查
```bash
curl http://localhost:3000/health
```

### 获取用户信息
```bash
curl -X GET http://localhost:3000/user/info \
  -H "Authorization: Bearer {token}"
```

### 更新用户信息
```bash
curl -X PUT http://localhost:3000/user/info \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nickname": "新昵称",
    "avatar": "https://..."
  }'
```

### 刷新 Token
```bash
curl -X POST http://localhost:3000/auth/refresh-token \
  -H "Authorization: Bearer {token}"
```

### 登出
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer {token}"
```

## 🔍 测试场景详解

### 场景 1：新用户登录

**输入**：
- 全新的微信用户
- 授权用户信息和手机号

**预期行为**：
1. 后端收到 code 和用户数据
2. 调用微信 API 验证 code
3. 创建新用户记录
4. 生成 Token
5. 返回用户信息

**日志输出**：
```
开始登录流程，code: 021...
微信验证成功，openid: oV0Rv...
创建新用户: 1234567890
生成 Token 成功
```

### 场景 2：既有用户登录

**输入**：
- 之前登录过的微信用户
- 可能更新了头像/昵称

**预期行为**：
1. 后端收到 code
2. 验证 code，获取 openid
3. 根据 openid 找到既有用户
4. 更新用户信息
5. 生成新 Token
6. 返回用户信息

**日志输出**：
```
开始登录流程，code: 021...
微信验证成功，openid: oV0Rv...
更新既有用户: 1234567890
生成 Token 成功
```

### 场景 3：Token 过期

**输入**：
- 使用过期的 Token 调用 API

**预期行为**：
1. Token 验证失败
2. 返回 401 错误
3. 前端自动重定向到登录页

**响应**：
```json
{
  "code": 1,
  "msg": "Token 无效或已过期"
}
```

## 📊 性能测试

### 并发登录测试

使用 Apache Bench：

```bash
# 安装 ab (Apache Bench)
# macOS
brew install httpd

# 并发 10 个请求，总共 100 个
ab -n 100 -c 10 http://localhost:3000/health
```

### 数据库查询性能

使用后端日志中的时间戳计算：

```
登录开始: 2024-01-01T12:00:00.000Z
登录结束: 2024-01-01T12:00:00.250Z
总耗时: 250ms（应该在 200-500ms 之内）
```

## 🚨 常见测试问题

### Q: 返回 404 Not Found
**A:** 确保 URL 正确，后端服务正在运行

### Q: 返回 401 Unauthorized
**A:** 检查 Authorization 头是否正确，Token 是否过期

### Q: 返回 500 Internal Server Error
**A:** 查看后端服务器日志，检查是否有错误堆栈跟踪

### Q: 解密失败
**A:** 检查 encryptedData、iv 是否正确，sessionKey 是否对应

### Q: 微信验证失败
**A:** 检查 WECHAT_APP_ID 和 WECHAT_APP_SECRET 是否正确配置

## 📈 监控和日志

### 后端日志

后端会输出以下信息：
```
[2024-01-01 12:00:00] 开始登录流程，code: 021...
[2024-01-01 12:00:00] 微信验证成功，openid: oV0Rv...
[2024-01-01 12:00:00] 创建新用户: 1234567890
[2024-01-01 12:00:00] 生成 Token 成功
```

### 前端日志

在微信开发者工具的 Console 中：
```javascript
// 查看网络请求
console.log('登录请求:', request)
console.log('登录响应:', response)

// 查看 Token
console.log('保存的 Token:', wx.getStorageSync('token'))
```

## ✨ 最佳实践

1. **总是从健康检查开始**
   - 确保后端正在运行

2. **使用 Postman 管理请求**
   - 保存常用请求
   - 组织成集合

3. **记录 Token**
   - 复制有效的 Token 用于后续测试
   - 测试 Token 过期场景

4. **检查日志**
   - 后端日志非常有用
   - 前端控制台也很重要

5. **测试边界情况**
   - 无效的 Token
   - 缺少的参数
   - 网络超时

## 🎓 下一步

- [ ] ✅ 后端服务正常运行
- [ ] ✅ 健康检查通过
- [ ] ✅ 登录 API 能正确处理请求
- [ ] ✅ 使用真实 Token 调用其他 API
- [ ] ✅ 测试 Token 过期场景
- [ ] ✅ 测试错误处理
- [ ] 📝 部署到生产环境
- [ ] 📝 实施监控和告警

---

**提示**: 如需迅速测试，可使用这个在线工具：[RequestBin](https://requestbin.com/)
