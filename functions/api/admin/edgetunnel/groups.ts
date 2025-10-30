import { Hono } from 'hono'
import { getDB, getJwtPayload } from '../../../utils/db'

console.log('EdgeTunnel groups module loaded');

type Bindings = {
  DB: any // Allow both D1Database and SQLite database
  JWT_SECRET: string
  PAYMENT_SECRET: string
  DB_PATH?: string // Add DB_PATH for local SQLite database
}

const app = new Hono<{ Bindings: Bindings }>()

console.log('EdgeTunnel groups app created');

// 添加一个测试路由
app.get('/test', (c) => {
  console.log('EdgeTunnel groups test route called');
  return c.json({ success: true, message: 'Test route working' });
});

// 获取所有EdgeTunnel服务组
app.get('/', async (c) => {
  try {
    console.log('获取EdgeTunnel服务组请求开始');
    const payload = await getJwtPayload(c.req.raw, c.env.JWT_SECRET);
    console.log('JWT验证通过:', payload);
    if (!payload || payload.role !== 1) {
      console.log('权限不足:', payload?.role);
      return c.json({ success: false, message: '权限不足' }, 403)
    }

    const db = getDB(c.env)
    console.log('数据库连接成功');
    
    const groups = await db.prepare(`
      SELECT 
        g.*,
        COUNT(n.id) as node_count,
        COUNT(CASE WHEN n.is_active = 1 THEN 1 END) as active_node_count,
        COUNT(u.id) as user_count
      FROM edgetunnel_groups g
      LEFT JOIN edgetunnel_nodes n ON g.id = n.group_id
      LEFT JOIN edgetunnel_user_nodes u ON g.id = u.group_id AND u.is_active = 1
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `).all()

    console.log('查询执行成功，结果:', groups);

    // 确保返回正确的数据结构
    const responseData = {
      success: true,
      data: {
        groups: groups.results || []
      }
    };
    
    console.log('返回数据结构:', responseData);
    return c.json(responseData)
  } catch (error: any) {
    console.error('获取EdgeTunnel服务组失败:', error)
    return c.json({
      success: false,
      message: '获取服务组失败: ' + (error.message || '未知错误')
    }, 500)
  }
})

// 创建EdgeTunnel服务组
app.post('/', async (c) => {
  try {
    console.log('EdgeTunnel create group POST request received');
    const payload = await getJwtPayload(c.req.raw, c.env.JWT_SECRET);
    console.log('JWT payload:', payload);
    if (!payload || payload.role !== 1) {
      console.log('Insufficient permissions, role:', payload?.role);
      return c.json({ success: false, message: '权限不足' }, 403)
    }

    const db = getDB(c.env)
    const body = await c.req.json()
    
    const { name, description, api_endpoint, api_key, max_users = 100 } = body
    
    if (!name || !api_endpoint || !api_key) {
      return c.json({
        success: false,
        message: '服务组名称、API端点和API密钥不能为空'
      }, 400)
    }

    const result = await db.prepare(`
      INSERT INTO edgetunnel_groups (name, description, api_endpoint, api_key, max_users)
      VALUES (?, ?, ?, ?, ?)
    `).bind(name, description || '', api_endpoint, api_key, max_users).run()

    if (!result.success) {
      throw new Error('创建服务组失败')
    }

    return c.json({
      success: true,
      message: '服务组创建成功',
      data: { id: result.meta.last_row_id }
    })
  } catch (error) {
    console.error('创建EdgeTunnel服务组失败:', error)
    return c.json({
      success: false,
      message: '创建服务组失败'
    }, 500)
  }
})

// 更新EdgeTunnel服务组
app.put('/:id', async (c) => {
  try {
    const payload = await getJwtPayload(c.req.raw, c.env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return c.json({ success: false, message: '权限不足' }, 403)
    }

    const db = getDB(c.env)
    const id = c.req.param('id')
    const body = await c.req.json()
    
    const { name, description, api_endpoint, api_key, max_users, is_active } = body
    
    // 验证必填字段
    if (!name || !api_endpoint || !api_key) {
      return c.json({
        success: false,
        message: '服务组名称、API端点和API密钥不能为空'
      }, 400)
    }

    // 确保所有字段都有默认值
    const updateData = {
      name: name || '',
      description: description || '',
      api_endpoint: api_endpoint || '',
      api_key: api_key || '',
      max_users: max_users !== undefined ? max_users : 100,
      is_active: is_active !== undefined ? is_active : 1
    };

    const result = await db.prepare(`
      UPDATE edgetunnel_groups 
      SET name = ?, description = ?, api_endpoint = ?, api_key = ?, max_users = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      updateData.name,
      updateData.description,
      updateData.api_endpoint,
      updateData.api_key,
      updateData.max_users,
      updateData.is_active,
      id
    ).run()

    if (!result.success) {
      throw new Error('更新服务组失败')
    }

    if (result.meta.changes === 0) {
      return c.json({
        success: false,
        message: '服务组不存在或未更新'
      }, 404)
    }

    return c.json({
      success: true,
      message: '服务组更新成功'
    })
  } catch (error: any) {
    console.error('更新EdgeTunnel服务组失败:', error)
    return c.json({
      success: false,
      message: '更新服务组失败: ' + (error.message || '未知错误')
    }, 500)
  }
})

// 删除EdgeTunnel服务组
app.delete('/:id', async (c) => {
  try {
    const payload = await getJwtPayload(c.req.raw, c.env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return c.json({ success: false, message: '权限不足' }, 403)
    }

    const db = getDB(c.env)
    const id = c.req.param('id')
    
    // 检查是否有关联的节点
    const nodeCountResult = await db.prepare(`
      SELECT COUNT(*) as count FROM edgetunnel_nodes WHERE group_id = ?
    `).bind(id).first()

    if (nodeCountResult && (nodeCountResult as any).count > 0) {
      return c.json({
        success: false,
        message: '无法删除包含节点的服务组，请先删除所有节点'
      }, 400)
    }

    const result = await db.prepare(`
      DELETE FROM edgetunnel_groups WHERE id = ?
    `).bind(id).run()

    if (!result.success) {
      throw new Error('删除服务组失败')
    }

    return c.json({
      success: true,
      message: '服务组删除成功'
    })
  } catch (error) {
    console.error('删除EdgeTunnel服务组失败:', error)
    return c.json({
      success: false,
      message: '删除服务组失败'
    }, 500)
  }
})

// 获取单个服务组详情
app.get('/:id', async (c) => {
  try {
    const payload = await getJwtPayload(c.req.raw, c.env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return c.json({ success: false, message: '权限不足' }, 403)
    }

    const db = getDB(c.env)
    const id = c.req.param('id')
    
    const group = await db.prepare(`
      SELECT 
        g.*,
        COUNT(n.id) as node_count,
        COUNT(CASE WHEN n.is_active = 1 THEN 1 END) as active_node_count,
        COUNT(u.id) as user_count
      FROM edgetunnel_groups g
      LEFT JOIN edgetunnel_nodes n ON g.id = n.group_id
      LEFT JOIN edgetunnel_user_nodes u ON g.id = u.group_id AND u.is_active = 1
      WHERE g.id = ?
      GROUP BY g.id
    `).bind(id).first()

    if (!group) {
      return c.json({
        success: false,
        message: '服务组不存在'
      }, 404)
    }

    return c.json({
      success: true,
      data: { group }
    })
  } catch (error) {
    console.error('获取EdgeTunnel服务组详情失败:', error)
    return c.json({
      success: false,
      message: '获取服务组详情失败'
    }, 500)
  }
})

export default app