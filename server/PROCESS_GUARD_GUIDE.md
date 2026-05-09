# 后端进程守护方案对比

## 方案选择对比表

| 方案 | 难度 | 功能 | 推荐场景 | 跨平台 |
|------|------|------|---------|--------|
| **PM2** | ⭐ 低 | 完整 | Node.js 生产环境 | ✅ 是 |
| **Systemd** | ⭐⭐ 中 | 完整 | Linux 生产环境 | ❌ Linux only |
| **Docker** | ⭐⭐⭐ 高 | 最完整 | 容器化部署 | ✅ 是 |
| **Forever** | ⭐ 低 | 简单 | 简单项目 | ✅ 是 |
| **Supervisor** | ⭐⭐ 中 | 完整 | Python/多语言 | ⭐ 需Python |

## 当前项目推荐方案：PM2

### 原因：
1. ✅ Node.js 官方推荐
2. ✅ 功能最完整（自启、监控、日志、集群模式）
3. ✅ 配置简单直观
4. ✅ 跨平台支持好
5. ✅ 社区活跃，有 PM2+ 付费增强版

## PM2 的核心特性

### 1. 自动重启
```javascript
autorestart: true        // 进程异常退出自动重启
max_restarts: 10        // 最多重启10次
min_uptime: '10s'       // 运行10秒才算成功启动
restart_delay: 4000     // 重启延迟4秒
```

### 2. 内存保护
```javascript
max_memory_restart: '500M'  // 内存超过500M自动重启
```

### 3. 优雅关闭
```javascript
kill_timeout: 5000  // 给进程5秒时间优雅关闭
listen_timeout: 10000
```

### 4. 文件监听（开发模式）
```javascript
watch: true                        // 监听文件变化自动重启
watch: ['routes', 'middleware']   // 只监听特定目录
ignore_watch: ['node_modules', 'uploads', 'logs']
```

### 5. 开机自启
```bash
pm2 startup          # 生成开机自启脚本
pm2 save             # 保存进程列表
```

### 6. 日志管理
```bash
pm2 logs                    # 查看所有日志
pm2 logs app-name          # 查看特定应用日志
pm2 log app-name --err     # 只看错误日志
```

## 快速开始命令

```bash
# 全局安装 PM2
npm install -g pm2

# 进入项目目录
cd server

# 方式1：使用配置文件启动
pm2 start ecosystem.config.js

# 方式2：使用 npm 脚本启动
npm run pm2:start

# 查看状态
pm2 status

# 查看日志
pm2 log

# 设置开机自启（Linux/macOS）
pm2 startup
pm2 save

# Windows 开机自启
# 使用 start-pm2.bat 或任务计划程序
```

## 生产环境部署检查清单

- [ ] 已安装 PM2（全局或项目级）
- [ ] 已创建 ecosystem.config.js 配置文件
- [ ] 已设置合理的内存限制（max_memory_restart）
- [ ] 已开启日志输出（output, error 字段）
- [ ] 已正确设置 NODE_ENV=production
- [ ] 已设置开机自启（pm2 startup && pm2 save）
- [ ] 已测试进程崩溃后的自动重启
- [ ] 已配置日志轮转（避免磁盘满）
- [ ] 已添加监控告警脚本
- [ ] 已备份 PM2 配置文件

## 补充方案：Systemd（仅 Linux）

如果需要系统级别的进程管理，可以创建 systemd 服务：

```ini
# /etc/systemd/system/jianxiong-miniapp.service
[Unit]
Description=jianxiong-miniapp-server
After=network.target

[Service]
Type=simple
User=app-user
WorkingDirectory=/home/app-user/jianxiong-miniapp/server
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

启用：
```bash
sudo systemctl daemon-reload
sudo systemctl enable jianxiong-miniapp
sudo systemctl start jianxiong-miniapp
```

## 补充方案：Docker 容器

使用 Docker 和 Docker Compose 实现更好的隔离。参考根目录的 dockerfile 配置。

## 故障排查

### 进程频繁重启
1. 检查日志：`pm2 log app-name`
2. 检查环境变量：`pm2 env app-name`
3. 检查依赖是否已安装：`npm list`
4. 检查端口是否被占用：`lsof -i :3000`

### 内存持续增长
1. 检查是否有内存泄漏
2. 考虑的周期性定时任务清理缓存
3. 调整 max_memory_restart 触发重启

### 无法开机自启
1. 确认执行了 `pm2 startup` 和 `pm2 save`
2. 检查 systemd 服务状态：`systemctl status pm2-<user>`
3. 检查用户权限

## 监控和告警

### 使用 PM2 Web 仪表板
```bash
pm2 web              # 启动 Web 监控页面 (http://localhost:9615)
```

### 集成第三方监控
- PM2+ (官方付费版)：https://pm2.io/
- Datadog
- New Relic
- 自定义脚本 + 邮件/钉钉告警

## 相关文件

- `ecosystem.config.js` - PM2 配置文件
- `PM2_GUIDE.md` - 详细使用指南
- `start-pm2.sh` - Linux/macOS 启动脚本
- `start-pm2.bat` - Windows 启动脚本
- `logrotate-setup.sh` - 日志轮转配置
