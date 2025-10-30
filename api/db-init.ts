import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export const config = {
  runtime: 'nodejs',
};

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
    
    const client = await pool.connect();
    
    try {
      // 开始事务
      await client.query('BEGIN');
      
      // 创建用户表
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(100),
          role INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // 创建套餐表
      await client.query(`
        CREATE TABLE IF NOT EXISTS plans (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          duration INTEGER NOT NULL,
          features JSONB,
          is_active INTEGER DEFAULT 1,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // 创建订单表
      await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          plan_id INTEGER NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          status INTEGER DEFAULT 0,
          payment_method VARCHAR(50),
          transaction_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (plan_id) REFERENCES plans(id)
        )
      `);
      
      // 创建用户订阅表
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_subscriptions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          plan_id INTEGER NOT NULL,
          order_id INTEGER NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (plan_id) REFERENCES plans(id),
          FOREIGN KEY (order_id) REFERENCES orders(id)
        )
      `);
      
      // 创建服务器表
      await client.query(`
        CREATE TABLE IF NOT EXISTS servers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          host VARCHAR(255) NOT NULL,
          port INTEGER NOT NULL,
          protocol VARCHAR(10) DEFAULT 'https',
          country VARCHAR(100),
          city VARCHAR(100),
          is_active INTEGER DEFAULT 1,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // 创建用户服务器分配表
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_servers (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          server_id INTEGER NOT NULL,
          subscription_id INTEGER NOT NULL,
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          is_active INTEGER DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (server_id) REFERENCES servers(id),
          FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
        )
      `);
      
      // 插入默认管理员用户 (密码为 admin123，实际应该加密)
      const adminUserResult = await client.query(
        "SELECT id FROM users WHERE email = 'admin@example.com'"
      );
      
      if (adminUserResult.rows.length === 0) {
        await client.query(`
          INSERT INTO users (email, password, name, role) 
          VALUES ('admin@example.com', '$2a$10$8K1p/a0dhrxiowP.dnkgNORTWgdEDHn5L2/xjpEWuC.QQv4rKO9jO', 'Admin', 1)
        `);
      }
      
      // 插入默认套餐
      const planResult = await client.query(
        "SELECT id FROM plans WHERE name = '基础套餐'"
      );
      
      if (planResult.rows.length === 0) {
        await client.query(`
          INSERT INTO plans (name, description, price, duration, features, sort_order) 
          VALUES 
          ('基础套餐', '适合个人用户', 9.99, 30, '{"connections": 1, "devices": 3, "support": "基础"}', 1),
          ('高级套餐', '适合小团队', 19.99, 30, '{"connections": 5, "devices": 10, "support": "优先"}', 2),
          ('企业套餐', '适合企业用户', 49.99, 30, '{"connections": 20, "devices": 50, "support": "24/7"}', 3)
        `);
      }
      
      // 提交事务
      await client.query('COMMIT');
      
      res.status(200).json({
        message: 'Database initialized successfully',
        tablesCreated: ['users', 'plans', 'orders', 'user_subscriptions', 'servers', 'user_servers']
      });
    } catch (error: any) {
      // 回滚事务
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Database initialization failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}