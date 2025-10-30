// Import our main app
import app from '../functions/_worker'
import { handle } from 'hono/vercel'

export const config = {
  runtime: 'nodejs',
}

export default handle(app)