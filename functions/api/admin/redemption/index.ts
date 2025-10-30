import { getDB, getJwtPayload } from '../../../utils/db';

export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { request, env } = context;
    
    // Authentication
    await getJwtPayload(request, env.JWT_SECRET);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status');
    const offset = (page - 1) * limit;

    const db = getDB(env);
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND rc.code LIKE ?';
      params.push(`%${search}%`);
    }

    if (status !== null && status !== '') {
      whereClause += ' AND rc.status = ?';
      params.push(parseInt(status));
    }

    const codesPromise = db.prepare(`
      SELECT rc.*, p.name as plan_name, u.email as used_by_email,
             creator.email as created_by_email
      FROM redemption_codes rc
      LEFT JOIN plans p ON rc.plan_id = p.id
      LEFT JOIN users u ON rc.used_by = u.id
      LEFT JOIN users creator ON rc.created_by = creator.id
      ${whereClause}
      ORDER BY rc.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    const countPromise = db.prepare(`
      SELECT COUNT(*) as total FROM redemption_codes rc ${whereClause}
    `).bind(...params).first();

    const [codes, countResult] = await Promise.all([codesPromise, countPromise]);

    const response = {
      success: true,
      data: {
        data: codes.results,
        total: (countResult?.total as number) || 0,
        page,
        limit,
      },
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

  } catch (error: any) {
    console.error('Get redemption codes error:', error);
    const status = error.message.includes('token') ? 401 : 500;
    return new Response(JSON.stringify({ success: false, message: '获取兑换码列表失败: ' + (error.message || '未知错误') }), {
      status: status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};