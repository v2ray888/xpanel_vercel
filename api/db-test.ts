import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 从环境变量获取数据库连接字符串
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      return res.status(500).json({ error: 'DATABASE_URL environment variable not set' });
    }
    
    // 创建数据库连接池
    const pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // 测试数据库连接
    const client = await pool.connect();
    
    try {
      // 检查是否存在plans表
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'plans'
      `);
      
      let message = '';
      if (result.rows.length === 0) {
        message = 'Plans table does not exist';
      } else {
        // 查询套餐数据
        const plansResult = await client.query('SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order DESC, id DESC');
        message = `Found ${plansResult.rows.length} active plans`;
      }
      
      // 检查用户表
      const userTableResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'users'
      `);
      
      const userTableExists = userTableResult.rows.length > 0;
      
      res.status(200).json({
        message: 'Database connection successful',
        connectionStringSet: !!connectionString,
        plansTableExists: result.rows.length > 0,
        userTableExists: userTableExists,
        plansInfo: message
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Database connection failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}