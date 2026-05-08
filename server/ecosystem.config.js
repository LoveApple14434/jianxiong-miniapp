module.exports = {
  apps: [
    {
      name: 'jianxiong-miniapp-server',
      script: './app.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // 自动重启配置
      autorestart: true,
      watch: false,
      // 最大内存使用
      max_memory_restart: '500M',
      // 监听这些文件变化会重启
      // watch: ['app.js', 'routes/**/*.js', 'middleware/**/*.js', 'models/**/*.js'],
      // 忽略监听的文件
      ignore_watch: ['node_modules', 'uploads', 'logs'],
      // 输出日志
      output: './logs/out.log',
      error: './logs/error.log',
      // 合并输出日志
      merge_logs: true,
      // 日志日期格式
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 监听异常情况
      max_restarts: 10,
      min_uptime: '10s',
      // 重启延迟（毫秒）
      restart_delay: 4000,
      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 10000,
      // 环境变量
      env_development: {
        NODE_ENV: 'development'
      }
    }
  ],
  deploy: {
    production: {
      user: 'node',
      host: '0.0.0.0',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/your-repo.git',
      path: '/var/www/jianxiong-miniapp-server',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
}
