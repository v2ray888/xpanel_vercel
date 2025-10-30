import { VercelRequest, VercelResponse } from '@vercel/node';

export default (req: VercelRequest, res: VercelResponse) => {
  // 检查环境变量
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasJwtSecret = !!process.env.JWT_SECRET;
  
  res.status(200).json({ 
    message: 'Environment variables check',
    hasDatabaseUrl,
    hasJwtSecret,
    databaseUrl: hasDatabaseUrl ? 'Set' : 'Not set',
    jwtSecret: hasJwtSecret ? 'Set' : 'Not set'
  });
};