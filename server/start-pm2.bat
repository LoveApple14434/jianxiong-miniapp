@echo off
REM Windows 下 PM2 守护进程启动脚本

REM 检查 PM2 是否已全局安装
pm2 -v >nul 2>&1
if errorlevel 1 (
    echo PM2 未能找到，请先全局安装 PM2：
    echo npm install -g pm2
    pause
    exit /b 1
)

REM 获取脚本所在目录
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ====================================
echo   jianxiong-miniapp-server 守护进程
echo ====================================
echo.

REM 显示菜单
echo 请选择操作：
echo 1. 启动服务 (生产环境)
echo 2. 启动服务 (开发环境)
echo 3. 查看状态
echo 4. 查看日志
echo 5. 重启服务
echo 6. 停止服务
echo 7. 删除进程
echo 8. 设置开机自启
echo 9. 退出
echo.

set /p choice="请输入选择 (1-9): "

if "%choice%"=="1" (
    echo 启动生产环境服务...
    pm2 start ecosystem.config.js
    pm2 save
    pause
) else if "%choice%"=="2" (
    echo 启动开发环境服务...
    pm2 start ecosystem.config.js --env development
    pm2 save
    pause
) else if "%choice%"=="3" (
    echo 显示进程状态...
    pm2 status
    pause
) else if "%choice%"=="4" (
    echo 显示实时日志 (按 Ctrl+C 结束)...
    timeout /t 2
    pm2 log jianxiong-miniapp-server
    pause
) else if "%choice%"=="5" (
    echo 重启服务...
    pm2 restart ecosystem.config.js
    pause
) else if "%choice%"=="6" (
    echo 停止服务...
    pm2 stop jianxiong-miniapp-server
    pause
) else if "%choice%"=="7" (
    echo 删除进程...
    pm2 delete jianxiong-miniapp-server
    pause
) else if "%choice%"=="8" (
    echo 配置开机自启...
    echo.
    echo Windows 上需要使用任务计划程序或 NSSM：
    echo 1. 任务计划程序方式：
    echo    - 打开"任务计划程序"
    echo    - 创建基本任务，在系统启动时运行：
    echo      cmd /c "cd !cd! ^& pm2 start ecosystem.config.js"
    echo.
    echo 2. NSSM 方式（推荐）：
    echo    - 下载 NSSM：https://nssm.cc/download
    echo    - 运行： nssm install pm2-guard pm2 start ecosystem.config.js
    echo    - 启动： nssm start pm2-guard
    echo.
    pause
) else if "%choice%"=="9" (
    exit /b 0
) else (
    echo 无效选择，请重试
    pause
    goto :eof
)

goto :eof
