import { handle } from 'hono/vercel'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ 
    message: 'Vercel API is working!',
    timestamp: new Date().toISOString()
  })
})

export const config = {
  runtime: 'edge',
}

export default handle(app)