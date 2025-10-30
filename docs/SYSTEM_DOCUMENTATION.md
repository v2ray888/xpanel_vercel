# XPanel VPN 订阅管理系统完整文档

## 📋 目录
- [系统概述](#系统概述)
- [核心功能](#核心功能)
- [订阅系统架构](#订阅系统架构)
- [API 接口文档](#api-接口文档)
- [前端页面说明](#前端页面说明)
- [数据库设计](#数据库设计)
- [安全机制](#安全机制)
- [部署指南](#部署指南)
- [使用说明](#使用说明)
- [故障排除](#故障排除)

## 🎯 系统概述

XPanel 是一个基于 Cloudflare Workers 的现代化 VPN 订阅管理系统，支持多种 VPN 协议和客户端格式。系统采用前后端分离架构，提供完整的用户管理、订阅管理、服务器管理和财务管理功能。

### 技术栈
- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **后端**: Cloudflare Workers + Hono Framework
- **数据库**: Cloudflare D1 (SQLite)
- **认证**: JWT Token
- **部署**: Cloudflare Pages

## 🚀 核心功能

### 1. 用户管理系统
- 用户注册、登录、密码重置
- 用户资料管理
- 推荐系统和佣金管理
- 多级用户权限控制

### 2. 订阅管理系统
- 套餐购买和续费
- 订阅状态监控
- 流量使用统计
- 设备限制管理

### 3. 订阅链接生成
- **通用订阅**: Base64编码格式，支持所有客户端
- **Clash**: Windows, macOS, Android 专用格式
- **V2Ray**: 全平台通用 JSON 格式
- **Shadowrocket**: iOS 专用格式
- **Quantumult X**: iOS 高级客户端格式
- **Surge**: iOS/macOS 专业客户端格式

### 4. 服务器管理
- 传统服务器节点管理
- EdgeTunnel 多节点群组管理
- 节点状态监控
- 负载均衡配置

### 5. 财务管理
- 订单管理和支付处理
- 优惠券系统
- 提现管理
- 财务报表统计

## 🏗️ 订阅系统架构

### 订阅Token机制

系统采用安全的JWT Token机制来管理订阅链接：

```typescript
// Token 生成流程
1. 用户购买订阅 → 生成固定Token
2. Token 绑定用户ID、订阅ID、过期时间
3. Token 存储在数据库中，支持撤销管理
4. 用户手动刷新 → 旧Token失效，生成新Token
```

### 订阅链接格式

#### 1. 通用订阅 (Universal)
```
GET /api/subscription/universal/{token}
返回: Base64编码的节点列表
格式: vless://uuid@host:port?params#name
```

#### 2. Clash 订阅
```
GET /api/subscription/clash/{token}
返回: YAML格式的Clash配置
包含: 代理组、规则集、DNS配置
```

#### 3. V2Ray 订阅
```
GET /api/subscription/v2ray/{token}
返回: JSON格式的V2Ray配置
支持: VMess, VLESS, Trojan, Shadowsocks
```

#### 4. 移动端订阅
```
Shadowrocket: /api/subscription/shadowrocket/{token}
Quantumult X: /api/subscription/quantumult/{token}
Surge: /api/subscription/surge/{token}
```

## 📡 API 接口文档

### 认证接口

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "referral_code": "optional_code"
}
```

### 订阅管理接口

#### 获取用户订阅
```http
GET /api/user/subscription
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "plan_name": "月付套餐",
    "status": 1,
    "start_date": "2024-01-01",
    "end_date": "2024-02-01",
    "traffic_used": 1073741824,
    "traffic_total": 107374182400,
    "device_limit": 3
  }
}
```

#### 获取订阅链接
```http
GET /api/user/subscription-links
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "data": {
    "links": {
      "universal": "https://api.example.com/api/subscription/universal/token",
      "clash": "clash://install-config?url=...",
      "v2ray": "https://api.example.com/api/subscription/v2ray/token",
      "shadowrocket": "https://api.example.com/api/subscription/shadowrocket/token"
    },
    "linksArray": [...]
  }
}
```

#### 刷新订阅Token
```http
POST /api/user/refresh-subscription-token
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "message": "订阅Token已重新生成"
}
```

### 订阅配置接口

#### 通用订阅
```http
GET /api/subscription/universal/{token}

Response: Base64编码的节点列表
Content-Type: text/plain; charset=utf-8
Content-Disposition: attachment; filename="subscription.txt"
```

#### Clash订阅
```http
GET /api/subscription/clash/{token}

Response: YAML格式的Clash配置
Content-Type: text/yaml; charset=utf-8
```

#### V2Ray订阅
```http
GET /api/subscription/v2ray/{token}

Response: JSON格式的V2Ray配置
Content-Type: application/json; charset=utf-8
```

### 管理员接口

#### 获取用户列表
```http
GET /api/admin/users?page=1&limit=20
Authorization: Bearer {admin_jwt_token}
```

#### 获取订单列表
```http
GET /api/admin/orders?page=1&limit=20
Authorization: Bearer {admin_jwt_token}
```

#### 服务器管理
```http
GET /api/admin/servers
POST /api/admin/servers
PUT /api/admin/servers/{id}
DELETE /api/admin/servers/{id}
```

## 🎨 前端页面说明

### 用户页面

#### 1. 仪表板 (`/user/dashboard`)
- 订阅状态概览
- 流量使用统计
- 最近连接记录
- 快速操作按钮

#### 2. 订阅管理 (`/user/subscription`)
- 当前订阅详情
- 流量使用进度
- 设备限制信息
- 续费和升级选项

#### 3. 订阅链接 (`/user/subscription-links`)
- 多格式订阅链接展示
- 二维码生成
- 一键复制功能
- Token刷新管理

#### 4. 推荐管理 (`/user/referral`)
- 推荐链接生成
- 推荐统计数据
- 佣金收益记录
- 提现申请

#### 5. 服务器节点 (`/user/servers`)
- 可用节点列表
- 节点延迟测试
- 节点状态监控
- 使用统计

### 管理员页面

#### 1. 管理仪表板 (`/admin/dashboard`)
- 系统统计概览
- 收入趋势图表
- 用户增长数据
- 服务器状态监控

#### 2. 用户管理 (`/admin/users`)
- 用户列表和搜索
- 用户详情查看
- 订阅状态管理
- 用户操作日志

#### 3. 订单管理 (`/admin/orders`)
- 订单列表和筛选
- 订单状态管理
- 支付记录查看
- 退款处理

#### 4. 服务器管理 (`/admin/servers`)
- 服务器节点配置
- EdgeTunnel群组管理
- 节点性能监控
- 负载均衡设置

#### 5. 财务管理 (`/admin/finance`)
- 收入统计报表
- 提现申请处理
- 优惠券管理
- 财务数据导出

## 🗄️ 数据库设计

### 核心表结构

#### 用户表 (users)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  referral_code TEXT UNIQUE,
  referred_by INTEGER,
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 订阅表 (user_subscriptions)
```sql
CREATE TABLE user_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  uuid TEXT UNIQUE NOT NULL,
  status INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  traffic_used BIGINT DEFAULT 0,
  traffic_total BIGINT NOT NULL,
  device_limit INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);
```

#### 订阅Token表 (subscription_tokens)
```sql
CREATE TABLE subscription_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subscription_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  is_revoked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  jwt_iat INTEGER NOT NULL,
  jwt_exp INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
);
```

#### 服务器表 (servers)
```sql
CREATE TABLE servers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  protocol TEXT NOT NULL,
  method TEXT,
  password TEXT,
  uuid TEXT,
  path TEXT,
  country TEXT,
  city TEXT,
  flag_emoji TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### EdgeTunnel群组表 (edgetunnel_groups)
```sql
CREATE TABLE edgetunnel_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  api_endpoint TEXT NOT NULL,
  api_token TEXT NOT NULL,
  max_users INTEGER DEFAULT 1000,
  current_users INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  status INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 安全机制

### 1. JWT Token认证
- 用户登录后获得JWT Token
- Token包含用户ID、角色、过期时间
- 所有API请求需要验证Token

### 2. 订阅Token管理
- 订阅Token与用户订阅绑定
- 支持Token撤销和重新生成
- Token过期时间与订阅期限同步

### 3. 密码安全
- 使用bcrypt加密存储密码
- 支持密码强度验证
- 提供密码重置功能

### 4. API安全
- CORS跨域保护
- 请求频率限制
- SQL注入防护

### 5. 数据加密
- 敏感数据加密存储
- HTTPS传输加密
- Token签名验证

## 🚀 部署指南

### 1. 环境准备
```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
```

### 2. 环境变量配置
```env
# 数据库配置
DB_PATH=./local.db

# JWT密钥
JWT_SECRET=your_jwt_secret_here

# Cloudflare配置
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

### 3. 数据库初始化
```bash
# 运行数据库迁移
wrangler d1 execute xpanel-db --local --file=database/schema.sql

# 插入初始数据
wrangler d1 execute xpanel-db --local --file=database/seed.sql
```

### 4. 本地开发
```bash
# 启动前端开发服务器
npm run dev

# 启动后端API服务器
wrangler pages dev dist --local --port 8787
```

### 5. 生产部署
```bash
# 构建前端
npm run build

# 部署到Cloudflare Pages
wrangler pages deploy dist

# 配置生产环境变量
wrangler pages secret put JWT_SECRET
```

## 📖 使用说明

### 用户使用流程

#### 1. 注册和登录
1. 访问系统首页
2. 点击"注册"创建账户
3. 验证邮箱并登录

#### 2. 购买订阅
1. 进入"套餐选择"页面
2. 选择合适的套餐
3. 完成支付流程
4. 系统自动激活订阅

#### 3. 获取订阅链接
1. 进入"订阅链接"页面
2. 选择客户端类型
3. 复制订阅链接或扫描二维码
4. 在VPN客户端中导入订阅

#### 4. 配置VPN客户端

##### Clash配置
1. 打开Clash客户端
2. 点击"配置"→"添加"
3. 粘贴Clash订阅链接
4. 点击"下载"更新配置

##### V2Ray配置
1. 打开V2Ray客户端
2. 点击"订阅"→"添加订阅"
3. 粘贴V2Ray订阅链接
4. 更新订阅获取节点

##### Shadowrocket配置 (iOS)
1. 打开Shadowrocket应用
2. 点击右上角"+"
3. 选择"Subscribe"
4. 粘贴订阅链接并保存

### 管理员使用流程

#### 1. 系统监控
1. 登录管理后台
2. 查看仪表板数据
3. 监控系统状态

#### 2. 用户管理
1. 进入"用户管理"页面
2. 查看用户列表和详情
3. 管理用户订阅状态

#### 3. 服务器管理
1. 进入"服务器管理"页面
2. 添加或编辑服务器节点
3. 配置EdgeTunnel群组
4. 监控节点状态

#### 4. 财务管理
1. 查看收入统计
2. 处理提现申请
3. 管理优惠券
4. 导出财务报表

## 🔧 故障排除

### 常见问题

#### 1. 订阅链接无法访问
**问题**: 点击订阅链接返回401错误
**解决方案**:
- 检查Token是否过期
- 重新生成订阅Token
- 确认订阅状态是否有效

#### 2. 节点无法连接
**问题**: VPN客户端无法连接到节点
**解决方案**:
- 检查服务器节点状态
- 验证节点配置信息
- 测试网络连通性

#### 3. 数据库连接错误
**问题**: API返回数据库连接失败
**解决方案**:
- 检查D1数据库状态
- 验证环境变量配置
- 重新运行数据库迁移

#### 4. JWT Token验证失败
**问题**: 用户登录后API请求被拒绝
**解决方案**:
- 检查JWT_SECRET配置
- 验证Token格式
- 重新登录获取新Token

### 调试工具

#### 1. 日志查看
```bash
# 查看Wrangler日志
wrangler pages deployment tail

# 查看本地开发日志
npm run dev -- --debug
```

#### 2. 数据库查询
```bash
# 连接本地数据库
wrangler d1 execute xpanel-db --local --command="SELECT * FROM users LIMIT 10"

# 查看订阅状态
wrangler d1 execute xpanel-db --local --command="SELECT * FROM user_subscriptions WHERE status = 1"
```

#### 3. API测试
```bash
# 测试用户登录
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 测试订阅链接
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8787/api/user/subscription-links
```

## 📞 技术支持

### 开发团队联系方式
- 技术支持邮箱: support@xpanel.com
- 开发文档: https://docs.xpanel.com
- GitHub仓库: https://github.com/xpanel/xpanel

### 更新日志
- v1.0.0: 初始版本发布
- v1.1.0: 添加通用订阅支持
- v1.2.0: 优化Token管理机制
- v1.3.0: 增强安全性和性能

---

**最后更新**: 2024年10月6日
**文档版本**: v1.3.0
**系统版本**: XPanel v1.3.0