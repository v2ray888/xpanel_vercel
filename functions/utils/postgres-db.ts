import { Pool, QueryResult } from 'pg';
import { verify } from 'hono/jwt';

// 定义 JWT 负载的类型
interface JwtPayload {
  id: number;
  email: string;
  role: number;
  exp: number;
}

// PostgreSQL 数据库连接池
let pool: Pool | null = null;

// 初始化数据库连接池
export function initDB(connectionString: string) {
  if (!pool) {
    pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

// 获取数据库连接
export function getDB() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDB first.');
  }
  return pool;
}

// 执行查询
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const client = await getDB().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// 验证 JWT 令牌
export async function getJwtPayload(request: Request, secret: string): Promise<JwtPayload> {
  console.log('getJwtPayload called with request:', request.headers.get('Authorization'));
  console.log('Secret:', secret);
  
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid Authorization header');
    throw new Error('Missing or invalid Authorization header');
  }
  const token = authHeader.substring(7);
  
  console.log('Token:', token);
  
  try {
    const payload = await verify(token, secret, 'HS256');
    console.log('Verified payload:', payload);
    return payload as unknown as JwtPayload;
  } catch (error: any) {
    console.error("JWT verification error:", error.message);
    // Re-throw a more generic error to avoid leaking implementation details
    throw new Error('Invalid or expired token');
  }
}

// 事务处理
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await getDB().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}