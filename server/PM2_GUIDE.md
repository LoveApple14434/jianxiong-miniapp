# PM2 进程守护配置指南

## 概述
使用 PM2 守护 Node.js 后端进程，确保程序崩溃后能自动重启。

## 安装

### 全局安装 PM2
```bash
npm install -g pm2
```

### 安装为项目依赖（可选）
```bash
cd server
npm install --save-dev pm2
```

## 快速开始

### 启动服务（生产环境）
```bash
cd server
npm run pm2:start
```

### 启动服务（开发环境）
```bash
npm run pm2:dev
```

### 查看进程状态
```bash
npm run pm2:status
# 或
pm2 status
```

### 查看日志
```bash
npm run pm2:log
# 或实时日志
pm2 log jianxiong-miniapp-server
```

### 重启进程
```bash
npm run pm2:restart
# 或无缝重启（0 downtime）
npm run pm2:reload
```

### 停止进程
```bash
npm run pm2:stop
```

### 杀死所有进程
```bash
npm run pm2:kill
```

## 开机自启配置

### Linux / macOS
```bash
# 生成开机自启脚本
pm2 startup

# 保存当前PM2进程列表
pm2 save

# 验证是否已添加到开机启动
systemctl status pm2-pm2-user.service
```

### Windows
1. 创建任务计划程序
2. 触发器：系统启动时
3. 操作：运行脚本 `pm2 start ecosystem.config.js`

或使用 NSSM 工具：
```bash
# 下载 NSSM：https://nssm.cc/download
nssm install pm2-service pm2 start ecosystem.config.js
nssm start pm2-service
```

## 常见命令

| 命令 | 说明 |
|------|------|
| `pm2 list` | 列出所有进程 |
| `pm2 logs` | 查看所有进程日志 |
| `pm2 logs [id/name]` | 查看特定进程日志 |
| `pm2 delete all` | 删除所有进程 |
| `pm2 delete [id/name]` | 删除特定进程 |
| `pm2 monit` | 实时监控资源使用 |
| `pm2 save` | 保存当前进程列表 |
| `pm2 resurrect` | 恢复已保存的进程列表 |

## 配置说明 (ecosystem.config.js)

### 关键参数

- **autorestart**: true - 进程异常退出时自动重启
- **watch**: false - 是否监听文件变化自动重启（建议生产环境关闭）
- **max_memory_restart**: 500M - 进程占用内存超过此值时重启
- **max_restarts**: 10 - 最多重启次数
- **min_uptime**: 10s - 进程运行10秒以上无异常才算重启成功
- **restart_delay**: 4000ms - 重启延迟时间
- **kill_timeout**: 5000ms - 等待进程优雅关闭的时间

## 监控和告警

### 使用 PM2+ (付费)
```bash
pm2 login
pm2 link [secret_key] [api_key]
```

### 手动脚本监控
创建 check-health.js：
```javascript
const http = require('http')

http.get('http://127.0.0.1:3000/api/health', (res) => {
  if (res.statusCode !== 200) {
    console.error('Health check failed:', res.statusCode)
    process.exit(1)
  }
}).on('error', (e) => {
  console.error('Error:', e)
  process.exit(1)
})
```

在 ecosystem.config.js 中添加：
```javascript
{
  name: 'health-check',
  script: './check-health.js',
  instances: 1,
  cron: '*/5 * * * *'  // 每5分钟检查一次
}
```

## 故障排查

### 进程无法启动
```bash
# 查看详细错误日志
pm2 logs [app_name]

# 检查配置文件语法
node -c ecosystem.config.js
```

### 进程频繁重启
检查：
1. 代码是否有初始化错误
2. 环境变量是否正确（NODE_ENV）
3. 数据库连接是否正常
4. 文件权限是否正确

### 修改配置后更新
```bash
# 重新加载配置
pm2 reload ecosystem.config.js
```

## 生产环境最佳实践

1. **使用 ecosystem.config.js** 管理配置，避免手动命令
2. **启用日志轮转** 防止日志文件过大
3. **设置合理的内存限制** 防止内存泄漏
4. **使用守护进程管理** + **监控告警**
5. **定期检查日志** 发现问题
6. **使用 pm2 save/resurrect** 实现开机自启

## 相关文档

- PM2 官网：https://pm2.keymetrics.io/
- PM2 文档：https://pm2.io/docs/
