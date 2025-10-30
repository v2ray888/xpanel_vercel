// Import our main app
import app from '../functions/_worker'
import { handle } from 'hono/vercel'

export const config = {
  runtime: 'nodejs18.x',
}

export default handle(app)