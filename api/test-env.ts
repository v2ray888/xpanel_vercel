import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'nodejs',
};

export default (req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({ 
    message: 'Environment variables test',
    databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
    jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set',
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET
  });
};