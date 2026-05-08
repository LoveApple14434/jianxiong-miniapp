# 日志轮转配置（可选）
# 使用 pm2-logrotate 模块自动管理日志文件大小

# 安装依赖
npm install --save-dev pm2-logrotate

# 启用日志轮转
pm2 install pm2-logrotate

# 配置日志轮转参数
pm2 set pm2-logrotate:max_size 100M          # 单个日志文件最大100MB
pm2 set pm2-logrotate:retain 30              # 保留30个日志文件
pm2 set pm2-logrotate:compress true          # 压缩旧日志
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD # 日期格式

# 查看当前配置
pm2 conf pm2-logrotate
