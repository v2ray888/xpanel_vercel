import { verify } from 'hono/jwt'

// Define the shape of the JWT payload
interface JwtPayload {
  id: number;
  email: string;
  role: number;
  exp: number;
}

export function getDB(env: { DB: D1Database }) {
  return env.DB;
}

export async function getJwtPayload(request: Request, secret:string): Promise<JwtPayload> {
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