import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'nodejs',
};

export default (req: VercelRequest, res: VercelResponse) => {
  // 测试环境变量
  const databaseUrl = process.env.DATABASE_URL;
  const jwtSecret = process.env.JWT_SECRET;
  
  res.status(200).json({ 
    message: 'Environment variables test',
    databaseUrl: databaseUrl ? 'Set' : 'Not set',
    jwtSecret: jwtSecret ? 'Set' : 'Not set',
    hasDatabaseUrl: !!databaseUrl,
    hasJwtSecret: !!jwtSecret
  });
};