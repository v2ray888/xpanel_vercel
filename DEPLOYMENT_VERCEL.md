# 部署到 Vercel 和 Neon PostgreSQL

本指南将帮助您将 XPanel 应用程序部署到 Vercel 并使用 Neon PostgreSQL 数据库。

## 📋 前置要求

1. [Node.js](https://nodejs.org/) 18+ 已安装
2. [Vercel CLI](https://vercel.com/cli) 已安装
3. [Neon PostgreSQL](https://neon.tech/) 账户
4. 本项目已克隆到本地

## 🚀 部署步骤

### 1. 创建 Neon PostgreSQL 数据库

1. 访问 [Neon.tech](https://neon.tech/) 并创建账户
2. 创建一个新的 PostgreSQL 数据库
3. 获取数据库连接字符串，格式如下：
   ```
   postgresql://neondb_owner:YOUR_PASSWORD@ep-divine-sky-adw4ohco-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

### 2. 配置环境变量

1. 复制环境变量模板：
   ```bash
   cp .env.vercel .env.local
   ```

2. 编辑 `.env.local` 文件，更新以下变量：
   - `DATABASE_URL`: 您的 Neon PostgreSQL 连接字符串
   - `JWT_SECRET`: JWT 签名密钥（应为强密钥）
   - `PAYMENT_SECRET`: 支付回调验证密钥（应为强密钥）

### 3. 安装依赖

```bash
npm install
```

### 4. 构建项目

```bash
npm run build
```

### 5. 部署到 Vercel

#### 方法一：使用部署脚本（推荐）

```bash
npm run deploy:vercel
```

#### 方法二：手动部署

1. 登录 Vercel：
   ```bash
   vercel login
   ```

2. 部署项目：
   ```bash
   vercel --prod
   ```

## 🛠 配置说明

### Vercel 环境变量

在 Vercel 项目设置中配置以下环境变量：

- `DATABASE_URL`: PostgreSQL 连接字符串
- `JWT_SECRET`: JWT 签名密钥
- `PAYMENT_SECRET`: 支付回调验证密钥

### 数据库配置

项目现在支持两种数据库：
1. **Cloudflare D1**（默认）- 用于 Cloudflare Pages 部署
2. **Neon PostgreSQL** - 用于 Vercel 部署

数据库适配器会根据环境自动选择合适的数据库类型。

## 📁 项目结构

```
cloudflare_xpanel/
├── src/                    # 前端源码
├── functions/              # 后端 API 函数
│   ├── _worker.ts         # 主入口文件（支持多数据库）
│   └── utils/
│       └── postgres-db.ts # PostgreSQL 数据库工具
├── database/              # 数据库文件
├── public/                # 静态资源
├── dist/                  # 构建输出
└── vercel.json           # Vercel 配置文件
```

## 🔧 故障排除

### 数据库连接问题

1. 确保 `DATABASE_URL` 环境变量正确配置
2. 检查 Neon PostgreSQL 数据库是否允许来自 Vercel 的连接
3. 验证数据库凭据是否正确

### 部署失败

1. 检查 Vercel CLI 是否正确安装
2. 确保项目根目录中有 `vercel.json` 配置文件
3. 验证所有依赖是否正确安装

## 🔄 迁移现有数据

如果您从 Cloudflare D1 迁移到 Neon PostgreSQL，需要：

1. 导出 D1 数据库数据
2. 转换数据格式以适配 PostgreSQL
3. 导入数据到 Neon PostgreSQL

## 📞 支持

如果您在部署过程中遇到任何问题，请：

1. 检查 [Issues](../../issues) 页面
2. 创建新的 Issue
3. 联系开发者