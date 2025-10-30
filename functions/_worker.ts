import { Hono } from 'hono'
import { jwt, sign } from 'hono/jwt'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { adminRoutes } from './api/routes/admin'
import { userRoutes } from './api/routes/users'
import { orderRoutes } from './api/routes/orders'
import { paymentRoutes } from './api/routes/payments'
import { redemptionRoutes } from './api/routes/redemption'
import { referralRoutes } from './api/routes/referrals'

// import { withdrawalRoutes } from './api/routes/withdrawals' // No longer needed
// import { financeRoutes } from './api/admin/finance' // No longer needed, handled by file-based routing
// import redemptionAdminRoutes from './api/admin/redemption/generate' // No longer needed, handled by file-based routing
// import { serversAdminRoutes } from './api/admin/servers'
// import { referralAdminRoutes } from './api/admin/referrals'
import { settingsAdminRoutes } from './api/admin/settings'
// Import Cloudflare Pages Functions
import { onRequestPost as loginHandler, onRequestOptions as loginOptionsHandler } from './api/auth/login'
import { onRequestPost as registerHandler } from './api/auth/register'
import { onRequestPost as adminLoginHandler } from './api/auth/admin-login'
import { onRequestGet as meHandler, onRequestOptions as meOptionsHandler } from './api/auth/me'
import { onRequestGet as plansHandler, onRequestOptions as plansOptionsHandler } from './api/plans'
import { onRequestGet as dashboardHandler, onRequestOptions as dashboardOptionsHandler } from './api/user/dashboard'
import { onRequestGet as userOrdersHandler, onRequestOptions as userOrdersOptionsHandler } from './api/user/orders'
import { onRequestGet as userProfileHandler, onRequestPut as userProfilePutHandler } from './api/user/profile'
import { onRequestGet as userSubscriptionHandler } from './api/user/subscription'
import { onRequestGet as userSubscriptionLinksHandler } from './api/user/subscription-links'
import { onRequestGet as userServersHandler } from './api/user/servers'
// import { onRequestGet as serversHandler } from './api/servers'
import { onRequestGet as adminStatsHandler } from './api/admin/stats'
import { onRequestGet as adminUsersHandler } from './api/admin/users'
import { onRequestGet as adminRecentOrdersHandler } from './api/admin/recent-orders'
import { onRequestGet as adminRecentUsersHandler } from './api/admin/recent-users'
import { onRequestGet as adminPlansHandler } from './api/admin/plans'
// import { onRequestGet as adminServersHandler } from './api/admin/servers'
import { onRequestGet as adminRedemptionHandler } from './api/admin/redemption'
import { onRequestPost as adminRedemptionGenerateHandler } from './api/admin/redemption/generate'
import { onRequestPost as adminRedemptionBatchDeleteHandler } from './api/admin/redemption/batch-delete'
import { onRequestPost as redemptionRedeemHandler } from './api/redemption/redeem'
// import { onRequestGet as referralStatsHandler } from './api/referrals/stats'
import { onRequestGet as referralCommissionsHandler } from './api/referrals/commissions'
import { onRequestGet as referralUsersHandler } from './api/referrals/users'
import { onRequestGet as paymentMethodsHandler } from './api/payments/methods'
import { onRequestGet as withdrawalsHandler, onRequestPost as withdrawalsPostHandler } from './api/withdrawals/index'
import { onRequestGet as adminFinanceStatsHandler } from './api/admin/finance/stats'
import { generateRedemptionCode } from './utils/generators'

type Bindings = {
  DB: D1Database | any // Allow both D1Database and PostgreSQL database
  JWT_SECRET: string
  PAYMENT_SECRET: string
  DB_PATH?: string // Add DB_PATH for local SQLite database
  DATABASE_URL?: string // Add DATABASE_URL for PostgreSQL connection
}

// 从redemption.ts中复制schema定义
const createRedemptionCodeSchema = z.object({
  plan_id: z.number().int().positive().optional(),
  quantity: z.number().int().positive().max(1000, '单次最多生成1000个'),
  prefix: z.string().optional(),
  expires_at: z.string().optional(),
})

const app = new Hono<{ Bindings: Bindings }>()

// 数据库初始化函数
async function initializeDatabase(db: any) {
  try {
    console.log('开始初始化数据库表结构...');
    
    // 检查数据库类型
    const isPostgres = db && typeof db.query === 'function';
    const isD1 = db && typeof db.prepare === 'function';
    
    if (isPostgres) {
      console.log('使用 PostgreSQL 数据库');
      // PostgreSQL 表检查和创建逻辑
      // 检查是否已存在 edgetunnel_groups 表
      const tableCheck = await db.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'edgetunnel_groups'"
      );
      
      console.log('表检查结果:', tableCheck.rows);
      
      if (tableCheck.rows.length === 0) {
        console.log('创建 EdgeTunnel 数据库表...');
        
        // 创建 EdgeTunnel 服务组表
        await db.query(`
          CREATE TABLE IF NOT EXISTS edgetunnel_groups (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            api_endpoint TEXT NOT NULL,
            api_key TEXT NOT NULL,
            max_users INTEGER DEFAULT 100,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // 创建 EdgeTunnel 节点表
        await db.query(`
          CREATE TABLE IF NOT EXISTS edgetunnel_nodes (
            id SERIAL PRIMARY KEY,
            group_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            protocol TEXT DEFAULT 'https',
            uuid TEXT NOT NULL,
            path TEXT DEFAULT '/',
            country TEXT DEFAULT '',
            city TEXT DEFAULT '',
            flag_emoji TEXT DEFAULT '',
            max_users INTEGER DEFAULT 100,
            current_users INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES edgetunnel_groups(id) ON DELETE CASCADE
          )
        `);
        
        // 创建 EdgeTunnel 用户分配表
        await db.query(`
          CREATE TABLE IF NOT EXISTS edgetunnel_user_nodes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            node_id INTEGER NOT NULL,
            group_id INTEGER NOT NULL,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (node_id) REFERENCES edgetunnel_nodes(id) ON DELETE CASCADE,
            FOREIGN KEY (group_id) REFERENCES edgetunnel_groups(id) ON DELETE CASCADE,
            UNIQUE(user_id, node_id)
          )
        `);
        
        // 创建 EdgeTunnel 流量日志表
        await db.query(`
          CREATE TABLE IF NOT EXISTS edgetunnel_traffic_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            node_id INTEGER NOT NULL,
            upload_bytes INTEGER DEFAULT 0,
            download_bytes INTEGER DEFAULT 0,
            total_bytes INTEGER DEFAULT 0,
            logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (node_id) REFERENCES edgetunnel_nodes(id) ON DELETE CASCADE
          )
        `);
        
        // 创建索引
        await db.query(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_nodes_group_id ON edgetunnel_nodes(group_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_nodes_active ON edgetunnel_nodes(is_active)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_user_nodes_user_id ON edgetunnel_user_nodes(user_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_user_nodes_node_id ON edgetunnel_user_nodes(node_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_user_nodes_active ON edgetunnel_user_nodes(is_active)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_traffic_logs_user_id ON edgetunnel_traffic_logs(user_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_traffic_logs_node_id ON edgetunnel_traffic_logs(node_id)`);
        
        console.log('EdgeTunnel 数据库表创建成功!');
      } else {
        console.log('EdgeTunnel 数据库表已存在，检查并更新表结构');
        
        // 检查并添加 protocol 列到 edgetunnel_nodes 表
        try {
          const protocolColumnCheck = await db.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'edgetunnel_nodes' AND column_name = 'protocol'"
          );
          
          if (protocolColumnCheck.rows.length === 0) {
            console.log('添加 protocol 列到 edgetunnel_nodes 表');
            await db.query(
              "ALTER TABLE edgetunnel_nodes ADD COLUMN protocol TEXT DEFAULT 'https'"
            );
            console.log('protocol 列添加成功');
          } else {
            console.log('protocol 列已存在');
          }
        } catch (error) {
          console.error('更新表结构时出错:', error);
        }
      }
      
      // 检查并创建 coupons 表
      const couponsTableCheck = await db.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'coupons'"
      );
      
      if (couponsTableCheck.rows.length === 0) {
        console.log('创建 coupons 数据库表...');
        
        // 创建 coupons 表
        await db.query(`
          CREATE TABLE IF NOT EXISTS coupons (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            type SMALLINT NOT NULL DEFAULT 1,
            value DECIMAL(10,2) NOT NULL,
            min_amount DECIMAL(10,2) DEFAULT 0,
            max_discount DECIMAL(10,2),
            usage_limit INTEGER DEFAULT -1,
            used_count INTEGER DEFAULT 0,
            user_limit INTEGER DEFAULT 1,
            start_date TIMESTAMP,
            end_date TIMESTAMP,
            is_active SMALLINT DEFAULT 1,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
          )
        `);
        
        // 创建 coupon_usage 表
        await db.query(`
          CREATE TABLE IF NOT EXISTS coupon_usage (
            id SERIAL PRIMARY KEY,
            coupon_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            order_id INTEGER NOT NULL,
            discount_amount DECIMAL(10,2) NOT NULL,
            used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (coupon_id) REFERENCES coupons(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (order_id) REFERENCES orders(id)
          )
        `);
        
        // 创建索引
        await db.query(`CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_coupons_start_end_date ON coupons(start_date, end_date)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_coupon_usage_order_id ON coupon_usage(order_id)`);
        
        console.log('Coupons 数据库表创建成功!');
      } else {
        console.log('Coupons 数据库表已存在');
      }
      
      // 检查并创建 subscription_tokens 表
      const subscriptionTokensTableCheck = await db.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'subscription_tokens'"
      );
      
      if (subscriptionTokensTableCheck.rows.length === 0) {
        console.log('创建 subscription_tokens 数据库表...');
        
        // 创建 subscription_tokens 表
        await db.query(`
          CREATE TABLE IF NOT EXISTS subscription_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            subscription_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            is_active INTEGER DEFAULT 1,
            revoked_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE
          )
        `);
        
        // 创建索引
        await db.query(`CREATE INDEX IF NOT EXISTS idx_subscription_tokens_user_id ON subscription_tokens(user_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_subscription_tokens_subscription_id ON subscription_tokens(subscription_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_subscription_tokens_token_hash ON subscription_tokens(token_hash)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_subscription_tokens_is_active ON subscription_tokens(is_active)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_subscription_tokens_expires_at ON subscription_tokens(expires_at)`);
        
        console.log('Subscription Tokens 数据库表创建成功!');
      } else {
        console.log('Subscription Tokens 数据库表已存在');
      }
    } else if (isD1) {
      console.log('使用 D1 数据库');
      // 保留原有的 D1 数据库初始化逻辑
      // 检查是否已存在 edgetunnel_groups 表
      const tableCheck = await db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='edgetunnel_groups'"
      ).first();
      
      console.log('表检查结果:', tableCheck);
      
      if (!tableCheck) {
        console.log('创建 EdgeTunnel 数据库表...');
        
        // 创建 EdgeTunnel 服务组表
        const groupTableResult = await db.prepare(`
          CREATE TABLE IF NOT EXISTS edgetunnel_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            api_endpoint TEXT NOT NULL,
            api_key TEXT NOT NULL,
            max_users INTEGER DEFAULT 100,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        
        console.log('edgetunnel_groups 表创建结果:', groupTableResult);
        
        // 创建 EdgeTunnel 节点表
        const nodeTableResult = await db.prepare(`
          CREATE TABLE IF NOT EXISTS edgetunnel_nodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            protocol TEXT DEFAULT 'https',
            uuid TEXT NOT NULL,
            path TEXT DEFAULT '/',
            country TEXT DEFAULT '',
            city TEXT DEFAULT '',
            flag_emoji TEXT DEFAULT '',
            max_users INTEGER DEFAULT 100,
            current_users INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES edgetunnel_groups(id) ON DELETE CASCADE
          )
        `).run();
        
        console.log('edgetunnel_nodes 表创建结果:', nodeTableResult);
        
        // 创建 EdgeTunnel 用户分配表
        const userNodeTableResult = await db.prepare(`
          CREATE TABLE IF NOT EXISTS edgetunnel_user_nodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            node_id INTEGER NOT NULL,
            group_id INTEGER NOT NULL,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (node_id) REFERENCES edgetunnel_nodes(id) ON DELETE CASCADE,
            FOREIGN KEY (group_id) REFERENCES edgetunnel_groups(id) ON DELETE CASCADE,
            UNIQUE(user_id, node_id)
          )
        `).run();
        
        console.log('edgetunnel_user_nodes 表创建结果:', userNodeTableResult);
        
        // 创建 EdgeTunnel 流量日志表
        const trafficLogTableResult = await db.prepare(`
          CREATE TABLE IF NOT EXISTS edgetunnel_traffic_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            node_id INTEGER NOT NULL,
            upload_bytes INTEGER DEFAULT 0,
            download_bytes INTEGER DEFAULT 0,
            total_bytes INTEGER DEFAULT 0,
            logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (node_id) REFERENCES edgetunnel_nodes(id) ON DELETE CASCADE
          )
        `).run();
        
        console.log('edgetunnel_traffic_logs 表创建结果:', trafficLogTableResult);
        
        // 创建索引
        const index1Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_nodes_group_id ON edgetunnel_nodes(group_id)`).run();
        console.log('索引1创建结果:', index1Result);
        
        const index2Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_nodes_active ON edgetunnel_nodes(is_active)`).run();
        console.log('索引2创建结果:', index2Result);
        
        const index3Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_user_nodes_user_id ON edgetunnel_user_nodes(user_id)`).run();
        console.log('索引3创建结果:', index3Result);
        
        const index4Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_user_nodes_node_id ON edgetunnel_user_nodes(node_id)`).run();
        console.log('索引4创建结果:', index4Result);
        
        const index5Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_user_nodes_active ON edgetunnel_user_nodes(is_active)`).run();
        console.log('索引5创建结果:', index5Result);
        
        const index6Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_traffic_logs_user_id ON edgetunnel_traffic_logs(user_id)`).run();
        console.log('索引6创建结果:', index6Result);
        
        const index7Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_edgetunnel_traffic_logs_node_id ON edgetunnel_traffic_logs(node_id)`).run();
        console.log('索引7创建结果:', index7Result);
        
        console.log('EdgeTunnel 数据库表创建成功!');
      } else {
        console.log('EdgeTunnel 数据库表已存在，检查并更新表结构');
        
        // 检查并添加 protocol 列到 edgetunnel_nodes 表
        try {
          const protocolColumnCheck = await db.prepare(
            "SELECT name FROM pragma_table_info('edgetunnel_nodes') WHERE name='protocol'"
          ).first();
          
          if (!protocolColumnCheck) {
            console.log('添加 protocol 列到 edgetunnel_nodes 表');
            await db.prepare(
              "ALTER TABLE edgetunnel_nodes ADD COLUMN protocol TEXT DEFAULT 'https'"
            ).run();
            console.log('protocol 列添加成功');
          } else {
            console.log('protocol 列已存在');
          }
        } catch (error) {
          console.error('更新表结构时出错:', error);
        }
        
        // 检查表结构是否完整
        const tables = await db.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'edgetunnel_%'"
        ).all();
        
        console.log('现有EdgeTunnel相关表:', tables);
      }
      
      // 检查并创建 coupons 表
      const couponsTableCheck = await db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='coupons'"
      ).first();
      
      if (!couponsTableCheck) {
        console.log('创建 coupons 数据库表...');
        
        // 创建 coupons 表
        const couponsTableResult = await db.prepare(`
          CREATE TABLE IF NOT EXISTS coupons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            type TINYINT NOT NULL DEFAULT 1,
            value DECIMAL(10,2) NOT NULL,
            min_amount DECIMAL(10,2) DEFAULT 0,
            max_discount DECIMAL(10,2),
            usage_limit INTEGER DEFAULT -1,
            used_count INTEGER DEFAULT 0,
            user_limit INTEGER DEFAULT 1,
            start_date DATETIME,
            end_date DATETIME,
            is_active TINYINT DEFAULT 1,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
          )
        `).run();
        
        console.log('coupons 表创建结果:', couponsTableResult);
        
        // 创建 coupon_usage 表
        const couponUsageTableResult = await db.prepare(`
          CREATE TABLE IF NOT EXISTS coupon_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            coupon_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            order_id INTEGER NOT NULL,
            discount_amount DECIMAL(10,2) NOT NULL,
            used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (coupon_id) REFERENCES coupons(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (order_id) REFERENCES orders(id)
          )
        `).run();
        
        console.log('coupon_usage 表创建结果:', couponUsageTableResult);
        
        // 创建索引
        const couponIndex1Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code)`).run();
        console.log('coupons code 索引创建结果:', couponIndex1Result);
        
        const couponIndex2Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active)`).run();
        console.log('coupons is_active 索引创建结果:', couponIndex2Result);
        
        const couponIndex3Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_coupons_start_end_date ON coupons(start_date, end_date)`).run();
        console.log('coupons start_end_date 索引创建结果:', couponIndex3Result);
        
        const couponUsageIndex1Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id)`).run();
        console.log('coupon_usage coupon_id 索引创建结果:', couponUsageIndex1Result);
        
        const couponUsageIndex2Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id)`).run();
        console.log('coupon_usage user_id 索引创建结果:', couponUsageIndex2Result);
        
        const couponUsageIndex3Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_coupon_usage_order_id ON coupon_usage(order_id)`).run();
        console.log('coupon_usage order_id 索引创建结果:', couponUsageIndex3Result);
        
        console.log('Coupons 数据库表创建成功!');
      } else {
        console.log('Coupons 数据库表已存在');
      }
      
      // 检查并创建 subscription_tokens 表
      const subscriptionTokensTableCheck = await db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='subscription_tokens'"
      ).first();
      
      if (!subscriptionTokensTableCheck) {
        console.log('创建 subscription_tokens 数据库表...');
        
        // 创建 subscription_tokens 表
        const subscriptionTokensTableResult = await db.prepare(`
          CREATE TABLE IF NOT EXISTS subscription_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            subscription_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            is_active INTEGER DEFAULT 1,
            revoked_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE
          )
        `).run();
        
        console.log('subscription_tokens 表创建结果:', subscriptionTokensTableResult);
        
        // 创建索引
        const subscriptionTokensIndex1Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_subscription_tokens_user_id ON subscription_tokens(user_id)`).run();
        console.log('subscription_tokens user_id 索引创建结果:', subscriptionTokensIndex1Result);
        
        const subscriptionTokensIndex2Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_subscription_tokens_subscription_id ON subscription_tokens(subscription_id)`).run();
        console.log('subscription_tokens subscription_id 索引创建结果:', subscriptionTokensIndex2Result);
        
        const subscriptionTokensIndex3Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_subscription_tokens_token_hash ON subscription_tokens(token_hash)`).run();
        console.log('subscription_tokens token_hash 索引创建结果:', subscriptionTokensIndex3Result);
        
        const subscriptionTokensIndex4Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_subscription_tokens_is_active ON subscription_tokens(is_active)`).run();
        console.log('subscription_tokens is_active 索引创建结果:', subscriptionTokensIndex4Result);
        
        const subscriptionTokensIndex5Result = await db.prepare(`CREATE INDEX IF NOT EXISTS idx_subscription_tokens_expires_at ON subscription_tokens(expires_at)`).run();
        console.log('subscription_tokens expires_at 索引创建结果:', subscriptionTokensIndex5Result);
        
        console.log('Subscription Tokens 数据库表创建成功!');
      } else {
        console.log('Subscription Tokens 数据库表已存在');
      }
    }
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

// 在注册路由之前初始化数据库
app.use('*', async (c, next) => {
  const db = c.env.DB;
  await initializeDatabase(db);
  await next();
});

// Add CORS middleware for all routes
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  // Set CORS headers with proper encoding
  c.res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  c.res.headers.set('Content-Type', 'application/json; charset=utf-8');
  
  await next();
  
  // Set CORS headers for the response
  c.res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  c.res.headers.set('Content-Type', 'application/json; charset=utf-8');
});

// Add OPTIONS handlers before JWT middleware


// Health check
app.get('/', (c) => {
  return c.json({ message: 'XPanel API is running!' })
})

// API routes
console.log('Registering API routes');
app.route('/api/admin', adminRoutes);

app.route('/api/admin/settings', settingsAdminRoutes);
app.route('/api/users', userRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/redemption', redemptionRoutes);
app.route('/api/referrals', referralRoutes);


// JWT middleware for protected routes
const jwtMiddleware = async (c: any, next: any) => {
  console.log('JWT middleware called for:', c.req.url);
  try {
    console.log('Verifying with secret:', c.env.JWT_SECRET);
    const authMiddleware = jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })
    const result = await authMiddleware(c, next)
    console.log('JWT verification successful');
    return result;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
}

// Apply JWT middleware to protected routes
app.use('/api/users/*', jwtMiddleware);

app.use('/api/orders/*', jwtMiddleware);
// 注意：兑换路由不需要JWT认证，所以不应用中间件
// app.use('/api/redemption/*', jwtMiddleware);
app.use('/api/referrals/*', jwtMiddleware);
app.use('/api/withdrawals', jwtMiddleware);
app.use('/api/admin/*', jwtMiddleware); // Apply JWT middleware to all admin routes

console.log('API routes registered');

// Public API routes
app.get('/api/plans', async (c) => {
  const response = await plansHandler({ request: c.req.raw, env: c.env } as any)
  // 确保响应头设置正确的字符编码
  response.headers.set('Content-Type', 'application/json; charset=utf-8')
  return response
})

app.options('/api/plans', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})

// Auth routes
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
})

app.post('/api/auth/login', async (c) => {
  const response = await loginHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.options('/api/auth/login', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})

app.post('/api/auth/register', async (c) => {
  const response = await registerHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.options('/api/auth/register', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})

app.post('/api/auth/admin-login', async (c) => {
  const response = await adminLoginHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.options('/api/auth/admin-login', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})

app.get('/api/auth/me', async (c) => {
  const response = await meHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.get('/api/user/dashboard', async (c) => {
  const response = await dashboardHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.get('/api/user/orders', async (c) => {
  const response = await userOrdersHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

// User profile routes
app.get('/api/users/profile', async (c) => {
  const response = await userProfileHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.put('/api/users/profile', async (c) => {
  const response = await userProfilePutHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

// User subscription routes
app.get('/api/user/subscription', async (c) => {
  const response = await userSubscriptionHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.get('/api/user/subscription-links', async (c) => {
  const response = await userSubscriptionLinksHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

// User servers route
app.get('/api/user/servers', async (c) => {
  const response = await userServersHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

// Public servers route
// app.get('/api/servers', async (c) => {
//   const response = await serversHandler({ request: c.req.raw, env: c.env } as any)
//   return response
// })

// Admin stats route
app.get('/api/admin/stats', async (c) => {
  const response = await adminStatsHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

// Admin users routes
app.get('/api/admin/users', async (c) => {
  const response = await adminUsersHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

// Admin orders route (using existing orders route)
app.get('/api/admin/orders', async (c) => {
  // For now, return empty array - implement later if needed
  return c.json({ success: true, data: { orders: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } })
})

// Admin recent data routes
app.get('/api/admin/recent-orders', async (c) => {
  const response = await adminRecentOrdersHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.get('/api/admin/recent-users', async (c) => {
  const response = await adminRecentUsersHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

// Admin plans routes
app.get('/api/admin/plans', async (c) => {
  const response = await adminPlansHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.post('/api/admin/plans', async (c) => {
  // For now, return success - implement later if needed
  return c.json({ success: true, message: 'Plan creation not implemented yet' })
})

// Admin servers routes
// app.get('/api/admin/servers', async (c) => {
//   const response = await adminServersHandler({ request: c.req.raw, env: c.env } as any)
//   return response
// })

app.post('/api/admin/servers', async (c) => {
  // For now, return success - implement later if needed
  return c.json({ success: true, message: 'Server creation not implemented yet' })
})

// Admin redemption routes
app.get('/api/admin/redemption', async (c) => {
  const response = await adminRedemptionHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.post('/api/admin/redemption/generate', async (c) => {
  const response = await adminRedemptionGenerateHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.post('/api/admin/redemption/batch-delete', async (c) => {
  const response = await adminRedemptionBatchDeleteHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

// Redemption redeem route
app.post('/api/redemption/redeem', async (c) => {
  const response = await redemptionRedeemHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

// Referral routes
app.get('/api/referrals/stats', async (c) => {
  // For now, return basic stats - implement later if needed
  return c.json({ 
    success: true, 
    data: { 
      total_referrals: 0, 
      total_commission: 0, 
      pending_commission: 0 
    } 
  })
})

app.get('/api/referrals/commissions', async (c) => {
  const response = await referralCommissionsHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.get('/api/referrals/users', async (c) => {
  const response = await referralUsersHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

// Payment methods route
app.get('/api/payments/methods', async (c) => {
  const response = await paymentMethodsHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

// Withdrawals routes
app.get('/api/withdrawals', async (c) => {
  const response = await withdrawalsHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.post('/api/withdrawals', async (c) => {
  const response = await withdrawalsPostHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

// Admin finance stats route
app.get('/api/admin/finance/stats', async (c) => {
  const response = await adminFinanceStatsHandler({ request: c.req.raw, env: c.env } as any)
  return response
})

app.options('/api/user/orders', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})

app.options('/api/user/dashboard', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})

app.options('/api/auth/me', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})





app.options('/api/admin/users', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})

app.options('/api/admin/users/:id/status', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})






// User routes OPTIONS handlers
app.options('/api/users/profile', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})

app.options('/api/users/password', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})

app.options('/api/users/subscription', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})

app.options('/api/users/orders', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})

// Withdrawals routes OPTIONS handlers
app.options('/api/withdrawals', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
})

// Finance routes OPTIONS handlers
app.options('/api/admin/finance/stats', (c) => {
  const origin = c.req.header('Origin');
  
  // 在开发环境中允许所有源，在生产环境中可以更严格
  const isDev = origin && (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') ||
    origin.endsWith('.pages.dev')
  );
  
  const allowedOrigin = isDev ? origin : '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
});

// Test environment variables route
app.get('/api/test-env', async (c) => {
  // This is a placeholder - the actual implementation is in functions/api/test-env.ts
  return c.json({ success: false, message: 'Route not implemented' }, 500)
})

// Simple health check route
app.get('/api/health-check', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'xpanel-api',
    version: '1.0.0'
  })
})

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, message: 'API route not found' }, 404)
})

// Database adapter for local development removed due to type errors

export default app