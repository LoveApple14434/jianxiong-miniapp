#!/bin/bash

# Linux/macOS PM2 守护进程启动脚本

set -e

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo ""
echo "===================================="
echo "  jianxiong-miniapp-server 守护进程"
echo "===================================="
echo ""

# 检查 PM2 是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，请先全局安装：npm install -g pm2"
    exit 1
fi

# 显示菜单
echo "请选择操作："
echo "1. 启动服务 (生产环境)"
echo "2. 启动服务 (开发环境)"
echo "3. 查看状态"
echo "4. 查看日志"
echo "5. 重启服务"
echo "6. 停止服务"
echo "7. 删除进程"
echo "8. 设置开机自启"
echo "9. 查看进程监控"
echo "10. 返回"
echo ""

read -p "请输入选择 (1-10): " choice

case $choice in
    1)
        echo "✓ 启动生产环境服务..."
        pm2 start ecosystem.config.js
        pm2 save
        echo "✓ 服务已启动"
        pm2 status
        ;;
    2)
        echo "✓ 启动开发环境服务..."
        pm2 start ecosystem.config.js --env development
        pm2 save
        echo "✓ 服务已启动"
        pm2 status
        ;;
    3)
        echo "✓ 显示进程状态..."
        pm2 status
        ;;
    4)
        echo "✓ 显示实时日志 (按 Ctrl+C 结束)..."
        sleep 1
        pm2 log jianxiong-miniapp-server
        ;;
    5)
        echo "✓ 重启服务..."
        pm2 reload ecosystem.config.js
        pm2 save
        echo "✓ 服务已重启"
        pm2 status
        ;;
    6)
        echo "✓ 停止服务..."
        pm2 stop jianxiong-miniapp-server
        echo "✓ 服务已停止"
        ;;
    7)
        read -p "确认删除进程吗? (y/n): " confirm
        if [[ $confirm == "y" || $confirm == "Y" ]]; then
            echo "✓ 删除进程..."
            pm2 delete jianxiong-miniapp-server
            echo "✓ 进程已删除"
        fi
        ;;
    8)
        echo "✓ 配置开机自启..."
        pm2 startup
        echo ""
        echo "✓ 保存当前进程列表..."
        pm2 save
        echo ""
        echo "✓ 开机自启配置完成！"
        echo "验证命令：systemctl status pm2-$(whoami).service"
        ;;
    9)
        echo "✓ 实时监控 (按 q 退出)..."
        pm2 monit
        ;;
    10)
        echo "退出"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
