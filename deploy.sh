#!/bin/bash
set -e

echo "========================================="
echo "  文字麻将 - 腾讯云部署脚本"
echo "========================================="

if ! command -v node &> /dev/null; then
  echo "📦 安装 Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "Node 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

if ! command -v pm2 &> /dev/null; then
  echo "📦 安装 PM2 进程管理器..."
  sudo npm install -g pm2
fi

APP_DIR="/opt/majiang"

if [ ! -d "$APP_DIR" ]; then
  echo "📥 克隆项目..."
  sudo mkdir -p $APP_DIR
  sudo chown -R $(whoami) $APP_DIR
  git clone https://github.com/zilan-ai/majiang.git $APP_DIR
fi

cd $APP_DIR

echo "📥 拉取最新代码..."
git pull origin main

echo "📦 安装依赖..."
npm install

echo "🔨 构建前端..."
npm run build

echo "🚀 启动服务..."
pm2 delete majiang 2>/dev/null || true
PORT=3000 pm2 start npx --name majiang -- tsx api/server.ts

echo "💾 设置 PM2 开机自启..."
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp /home/$(whoami) 2>/dev/null || true

echo ""
echo "========================================="
echo "  ✅ 部署完成！"
echo "========================================="
echo ""
echo "  服务地址: http://$(curl -s ifconfig.me):3000"
echo "  健康检查: http://$(curl -s ifconfig.me):3000/api/health"
echo ""
echo "  常用命令:"
echo "    pm2 status        查看服务状态"
echo "    pm2 logs majiang  查看日志"
echo "    pm2 restart majiang  重启服务"
echo "========================================="
