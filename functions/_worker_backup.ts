import { Hono } from 'hono'
import { jwt, sign } from 'hono/jwt'
import { HTTPException } from 'hono/http-exception'
import bcrypt from 'bcryptjs'
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
  DB: D1Database | any // Allow both D1Database and SQLite database
  JWT_SECRET: string
  PAYMENT_SECRET: string
  DB_PATH?: string // Add DB_PATH for local SQLite database
}

// 从redemption.ts中复制schema定义
const createRedemptionCodeSchema = z.object({
  plan_id: z.number().int().positive().optional(),
  quantity: z.number().int().positive().max(1000, '单次最多生成1000个'),
  prefix: z.string().optional(),
  expires_at: z.string().optional(),
})

const app = new Hono<{ Bindings: Bindings }>()

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