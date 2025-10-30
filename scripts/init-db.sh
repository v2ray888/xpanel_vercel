#!/bin/bash

# 数据库初始化脚本

set -e

echo "🗄️ 初始化 XPanel 数据库..."

# 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI 未安装，请先安装："
    echo "npm install -g wrangler"
    exit 1
fi

# 检查是否已登录
if ! wrangler whoami &> /dev/null; then
    echo "❌ 未登录 Cloudflare，请先登录："
    echo "wrangler login"
    exit 1
fi

# 检查数据库是否存在
if ! wrangler d1 list | grep -q "xpanel-db"; then
    echo "📝 创建数据库 'xpanel-db'..."
    wrangler d1 create xpanel-db
    echo "⚠️ 请将生成的数据库 ID 更新到 wrangler.toml 文件中"
    echo "然后重新运行此脚本"
    exit 1
fi

# 执行数据库结构创建
echo "🏗️ 创建数据库表结构..."
wrangler d1 execute xpanel-db --env production --file=./database/schema.sql

# 执行 EdgeTunnel 数据库结构创建
echo "🏗️ 创建 EdgeTunnel 数据库表结构..."
wrangler d1 execute xpanel-db --env production --file=./database/edgetunnel-schema.sql

# 插入初始数据
echo "📊 插入初始数据..."
wrangler d1 execute xpanel-db --env production --file=./database/seed.sql

echo "✅ 数据库初始化完成！"
echo ""
echo "🔑 默认管理员账户："
echo "邮箱: admin@xpanel.com"
echo "密码: admin123"
echo ""
echo "⚠️ 部署后请立即修改默认管理员密码！"