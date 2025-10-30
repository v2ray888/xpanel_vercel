# 通过 Git 部署到 Vercel 指南

本指南将详细介绍如何通过 Git 将 XPanel 应用程序部署到 Vercel 并使用 Neon PostgreSQL 数据库。

## 📋 前置要求

1. 已在 GitHub 上创建仓库并推送代码
2. 已安装 [Vercel CLI](https://vercel.com/cli)（可选，但推荐）
3. 已创建 [Neon.tech](https://neon.tech/) 账户并创建 PostgreSQL 数据库

## 🚀 部署步骤

### 1. 准备 GitHub 仓库

确保您的代码已推送到 GitHub：

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. 连接 Vercel 到 GitHub

1. 访问 [Vercel 官网](https://vercel.com/) 并登录
2. 点击右上角的 "New Project"
3. 点击 "Continue with GitHub" 授权 Vercel 访问您的 GitHub 账户
4. 搜索并选择您的仓库（例如：`xpanel_vercel`）

### 3. 配置项目

在项目配置页面中：

#### 基本设置
- **Project Name**: 保持默认或自定义
- **Framework Preset**: 选择 "Other"
- **Root Directory**: 保持为空

#### 构建和输出设置
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. 配置环境变量

在 "Environment Variables" 部分添加以下变量：

| 变量名 | 值 | 描述 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_VW5Xv1hyzcTI@ep-divine-sky-adw4ohco-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Neon PostgreSQL 连接字符串 |
| `JWT_SECRET` | `[您的JWT密钥]` | JWT 签名密钥（至少32个字符的安全随机字符串） |
| `PAYMENT_SECRET` | `[您的支付密钥]` | 支付回调验证密钥（至少32个字符的安全随机字符串） |

### 5. 部署

1. 点击 "Deploy" 按钮
2. 等待 Vercel 完成构建和部署过程

### 6. 监控部署

您可以在 Vercel 控制台中查看部署进度：

1. 构建日志
2. 部署状态
3. 性能分析

## 🔧 高级配置

### 自定义域名

1. 在 Vercel 项目设置中进入 "Domains" 部分
2. 添加您的自定义域名
3. 按照指示配置 DNS 记录

### 环境分支

Vercel 支持基于分支的环境：

- `main` 分支：生产环境
- `develop` 分支：预览环境
- 功能分支：临时预览部署

### 自动化部署

Vercel 会在以下情况下自动触发新部署：

1. 推送代码到已连接的分支
2. 创建 Pull Request
3. 合并 Pull Request

## 🔄 持续集成/持续部署 (CI/CD)

### GitHub Actions 集成

您可以在 `.github/workflows` 目录中创建 CI/CD 工作流：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Run tests
      run: npm test
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 📊 监控和分析

### 性能监控

Vercel 提供以下监控功能：

1. **实时日志**: 查看应用程序日志
2. **性能分析**: 页面加载时间和 API 响应时间
3. **错误跟踪**: 自动捕获和报告错误

### 自定义监控

您可以集成第三方监控工具：

1. **Sentry**: 错误跟踪和性能监控
2. **DataDog**: 基础设施和应用程序监控
3. **New Relic**: 全栈可观测性平台

## 🔐 安全最佳实践

### 环境变量安全

1. 永不将敏感信息硬编码在代码中
2. 使用 Vercel 的加密环境变量
3. 定期轮换密钥

### 访问控制

1. 限制对 Vercel 项目的访问权限
2. 使用团队账户而非个人账户
3. 启用双因素认证

## 🛠 故障排除

### 常见问题

#### 构建失败
1. 检查依赖是否正确安装
2. 确认 Node.js 版本兼容性
3. 查看构建日志中的错误信息

#### 数据库连接问题
1. 验证 `DATABASE_URL` 是否正确
2. 检查 Neon PostgreSQL 数据库状态
3. 确认网络防火墙设置

#### 部署超时
1. 优化构建过程
2. 减少构建依赖
3. 使用缓存策略

### 调试技巧

1. 使用 `vercel logs` 命令查看实时日志
2. 在本地使用 `vercel dev` 进行开发测试
3. 利用 Vercel 的预览部署功能

## 🔄 后续更新

### 手动部署

使用 Vercel CLI 进行手动部署：

```bash
# 安装 Vercel CLI（如果尚未安装）
npm install -g vercel

# 登录 Vercel
vercel login

# 部署到生产环境
vercel --prod
```

### 自动化更新

1. 推送代码到 GitHub
2. Vercel 将自动检测更改并触发新部署
3. 通过 GitHub Actions 实现更复杂的 CI/CD 流程

## 📞 支持资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Vercel 社区论坛](https://github.com/vercel/community/discussions)
- [Neon.tech 文档](https://neon.tech/docs)
- 项目 [DEPLOYMENT_VERCEL.md](file:///e:/webapp/%E5%AE%8C%E5%B7%A5v1%E7%89%88%E5%A4%87%E4%BB%BD/cloudflare_xpanela_vercel/DEPLOYMENT_VERCEL.md) 文件

## 📈 最佳实践

1. **使用预览部署**: 在合并到主分支前测试所有更改
2. **监控性能**: 定期检查应用性能指标
3. **安全审计**: 定期审查环境变量和访问权限
4. **备份策略**: 确保数据库定期备份
5. **成本控制**: 监控资源使用情况以控制成本