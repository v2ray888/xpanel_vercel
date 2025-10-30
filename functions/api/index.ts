import { Hono } from 'hono'
import { adminRoutes } from './routes/admin'
import { userRoutes } from './routes/users'
import { orderRoutes } from './routes/orders'
// import { serverRoutes } from './routes/servers'
import { paymentRoutes } from './routes/payments'
import { redemptionRoutes } from './routes/redemption'
import { settingsAdminRoutes } from './admin/settings'
// import { serversAdminRoutes } from './admin/servers'
import { referralAdminRoutes } from './admin/referrals'

const app = new Hono()

// Health check endpoint
app.get('/', (c) => {
  return c.json({ message: 'API is working!' })
})

app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'xpanel-api'
  })
})

// Mount all API routes
app.route('/api/admin', adminRoutes)
app.route('/api/admin/settings', settingsAdminRoutes)
// app.route('/api/admin/servers', serversAdminRoutes)
app.route('/api/admin/referrals', referralAdminRoutes)
app.route('/api/users', userRoutes)
app.route('/api/orders', orderRoutes)
// app.route('/api/servers', serverRoutes)
app.route('/api/payments', paymentRoutes)
app.route('/api/redemption', redemptionRoutes)

export default app