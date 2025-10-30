# XPanel - VPN销售管理系统

一个基于 Cloudflare Pages + D1 数据库构建的现代化 VPN 销售管理系统。

## 🚀 功能特性

### 用户功能
- 用户注册/登录
- 套餐购买和订阅管理
- 服务器节点查看和连接
- 兑换码兑换
- 推荐系统和佣金管理
- 个人资料管理

### 管理员功能
- 用户管理
- 套餐管理
- 服务器节点管理
- 订单管理
- 兑换码生成和管理
- 推荐佣金管理
- 系统设置
- 数据统计和分析

## 🛠 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **React Router** - 路由管理
- **React Query** - 数据获取和缓存
- **React Hook Form** - 表单管理
- **Zod** - 数据验证

### 后端
- **Cloudflare Pages Functions** - 无服务器函数
- **Cloudflare D1** - SQLite 数据库
- **Hono** - 轻量级 Web 框架
- **JWT** - 身份验证
- **bcryptjs** - 密码加密

## 📦 部署指南

### 1. 环境准备

确保你已经安装了：
- Node.js 18+
- npm 或 yarn
- Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 克隆项目

```bash
git clone <your-repo-url>
cd cloudflare_xpanel
npm install
```

### 3. 配置环境变量

复制环境变量模板：
```bash
cp .env.example .env.local
```

### 4. 数据库设置

创建 D1 数据库：
```bash
wrangler d1 create xpanel-db
```

更新 `wrangler.toml` 中的数据库 ID，然后初始化数据库：
```bash
npm run db:generate
npm run db:seed
```

### 5. 本地开发

启动开发服务器：
```bash
npm run dev
```

启动 API 开发服务器：
```bash
npm run dev:api
```

### 6. 部署到 Cloudflare Pages

构建项目：
```bash
npm run build
```

部署到 Cloudflare Pages：
```bash
npm run deploy
```

或者使用完整部署命令：
```bash
npm run deploy:all
```

### 7. 通过 Git 部署到 Vercel

确保代码已推送到 GitHub：
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

然后按照 [GIT_DEPLOYMENT_VERCEL.md](GIT_DEPLOYMENT_VERCEL.md) 中的说明连接 Vercel 到您的 GitHub 仓库并配置环境变量。

## 🔧 配置说明

### Cloudflare Pages 设置

在 Cloudflare Pages 项目设置中配置以下环境变量：

- `JWT_SECRET`: JWT 签名密钥
- `PAYMENT_SECRET`: 支付回调验证密钥

### 数据库配置

确保在 `wrangler.toml` 中正确配置了 D1 数据库绑定：

```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "xpanel-db"
database_id = "your-database-id"
```

### Vercel 设置

在 Vercel 项目设置中配置以下环境变量：

- `DATABASE_URL`: Neon PostgreSQL 连接字符串
- `JWT_SECRET`: JWT 签名密钥
- `PAYMENT_SECRET`: 支付回调验证密钥

查看 [DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md) 获取详细部署指南。

## 📁 项目结构

```
cloudflare_xpanel/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   ├── pages/             # 页面组件
│   ├── layouts/           # 布局组件
│   ├── contexts/          # React Context
│   ├── hooks/             # 自定义 Hooks
│   ├── lib/               # 工具库
│   └── types/             # TypeScript 类型定义
├── functions/             # Cloudflare Pages Functions
│   ├── api/               # API 路由
│   ├── utils/             # 工具函数
│   └── _middleware.ts     # 中间件
├── database/              # 数据库文件
│   ├── schema.sql         # 数据库结构
│   └── seed.sql           # 初始数据
├── public/                # 静态资源
└── dist/                  # 构建输出
```

## 🔐 安全特性

- JWT 身份验证
- 密码 bcrypt 加密
- CORS 跨域保护
- SQL 注入防护
- XSS 防护
- 管理员权限验证

## 📊 默认管理员账户

- 邮箱: `admin@xpanel.com`
- 密码: `admin123`

**⚠️ 部署后请立即修改默认管理员密码！**

## 🛡 API 文档

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息

### 套餐管理
- `GET /api/plans` - 获取公开套餐列表
- `GET /api/admin/plans` - 获取所有套餐（管理员）
- `POST /api/admin/plans` - 创建套餐（管理员）
- `PUT /api/admin/plans/:id` - 更新套餐（管理员）
- `DELETE /api/admin/plans/:id` - 删除套餐（管理员）

### 订单管理
- `POST /api/orders` - 创建订单
- `GET /api/user/orders` - 获取用户订单
- `GET /api/admin/orders` - 获取所有订单（管理员）

### 服务器管理
- `GET /api/servers` - 获取服务器列表
- `GET /api/user/servers` - 获取用户可用服务器
- `POST /api/admin/servers` - 创建服务器（管理员）

### 兑换码
- `POST /api/redemption/redeem` - 兑换码兑换
- `POST /api/admin/redemption-codes/generate` - 生成兑换码（管理员）

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果你遇到任何问题，请：

1. 查看 [Issues](../../issues) 页面
2. 创建新的 Issue
3. 联系开发者

## 🔄 更新日志

### v1.0.0
- 初始版本发布
- 基础用户和管理员功能
- Cloudflare Pages 部署支持
- D1 数据库集成
- Vercel 部署支持
- Neon PostgreSQL 数据库支持