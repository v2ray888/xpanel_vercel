import { Hono } from 'hono'
import { getDB, getJwtPayload } from '../../../utils/db'

// 生成UUID的函数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


type Bindings = {
  DB: any // Allow both D1Database and SQLite database
  JWT_SECRET: string
  PAYMENT_SECRET: string
  DB_PATH?: string // Add DB_PATH for local SQLite database
}

const app = new Hono<{ Bindings: Bindings }>()

// 获取服务组下的所有节点
app.get('/group/:groupId', async (c) => {
  try {
    const payload = await getJwtPayload(c.req.raw, c.env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return c.json({ success: false, message: '权限不足' }, 403)
    }

    const db = getDB(c.env)
    const groupId = c.req.param('groupId')
    
    const nodes = await db.prepare(`
      SELECT n.*, g.name as group_name
      FROM edgetunnel_nodes n
      LEFT JOIN edgetunnel_groups g ON n.group_id = g.id
      WHERE n.group_id = ?
      ORDER BY n.created_at DESC
    `).bind(groupId).all()

    return c.json({
      success: true,
      data: {
        nodes: nodes.results || []
      }
    })
  } catch (error: any) {
    console.error('获取EdgeTunnel节点失败:', error)
    return c.json({
      success: false,
      message: '获取节点失败'
    }, 500)
  }
})

// 批量创建EdgeTunnel节点（通过文本格式）
app.post('/batch-import', async (c) => {
  try {
    console.log('Batch import request received');
    const payload = await getJwtPayload(c.req.raw, c.env.JWT_SECRET);
    console.log('JWT payload:', payload);
    if (!payload || payload.role !== 1) {
      console.log('Unauthorized access attempt');
      return c.json({ success: false, message: '权限不足' }, 403)
    }

    const db = getDB(c.env)
    const body = await c.req.json()
    console.log('Request body:', body);
    
    const { text, group_id } = body
    
    if (!text || !group_id) {
      console.log('Missing required fields:', { text, group_id });
      return c.json({
        success: false,
        message: '文本内容和服务组ID不能为空'
      }, 400)
    }

    // 解析文本内容
    const lines = text.split('\n').filter((line: string) => line.trim() !== '');
    console.log('Parsed lines:', lines);
    const nodes = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      // 解析格式: IP:端口#地区名称 延迟
      // 例如: 8.39.125.153:2053#SG 官方优选 65ms
      const match = trimmedLine.match(/^([\d.]+):(\d+)#(.+?)\s+(\d+)ms$/);
      if (match) {
        const [, host, port, name, latency] = match;
        nodes.push({
          name: `${name} ${latency}ms`,
          host,
          port: parseInt(port),
          protocol: 'vless', // 默认协议改为vless
          group_id,
          is_active: 1,
          uuid: generateUUID() // 生成UUID
        });
      }
    }

    console.log('Parsed nodes:', nodes);

    if (nodes.length === 0) {
      console.log('No valid nodes found in text');
      return c.json({
        success: false,
        message: '未解析到有效的节点信息'
      }, 400)
    }

    // 批量插入节点
    const insertedNodes = []
    for (const node of nodes) {
      const { name, host, port, protocol, group_id, is_active, uuid } = node
      
      console.log('Inserting node:', { name, host, port, protocol, group_id, is_active, uuid });
      
      const result = await db.prepare(`
        INSERT INTO edgetunnel_nodes (name, host, port, protocol, group_id, is_active, uuid)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(name, host, port, protocol, group_id, is_active, uuid).run()

      console.log('Insert result:', result);

      if (!result.success) {
        throw new Error(`创建节点失败: ${name}`)
      }

      insertedNodes.push({
        id: result.meta.last_row_id,
        name,
        host,
        port,
        protocol,
        group_id,
        is_active,
        uuid
      })
    }

    console.log('Successfully inserted nodes:', insertedNodes);
    return c.json({
      success: true,
      message: `成功导入 ${insertedNodes.length} 个节点`,
      data: { nodes: insertedNodes }
    })
  } catch (error: any) {
    console.error('批量导入EdgeTunnel节点失败:', error)
    return c.json({
      success: false,
      message: '批量导入节点失败: ' + (error.message || '未知错误')
    }, 500)
  }
})

// 批量创建EdgeTunnel节点（JSON格式）
app.post('/batch', async (c) => {
  try {
    const payload = await getJwtPayload(c.req.raw, c.env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return c.json({ success: false, message: '权限不足' }, 403)
    }

    const db = getDB(c.env)
    const body = await c.req.json()
    
    const { nodes } = body
    
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return c.json({
        success: false,
        message: '节点数据不能为空'
      }, 400)
    }

    // 验证每个节点数据
    for (const node of nodes) {
      const { name, host, port, protocol, group_id } = node
      if (!name || !host || !port || !protocol || !group_id) {
        return c.json({
          success: false,
          message: '节点名称、主机地址、端口、协议和服务组不能为空'
        }, 400)
      }
    }

    // 批量插入节点
    const insertedNodes = []
    for (const node of nodes) {
      const { name, host, port, protocol, group_id, is_active = 1 } = node
      
      const result = await db.prepare(`
        INSERT INTO edgetunnel_nodes (name, host, port, protocol, group_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(name, host, port, protocol, group_id, is_active).run()

      if (!result.success) {
        throw new Error(`创建节点失败: ${name}`)
      }

      insertedNodes.push({
        id: result.meta.last_row_id,
        name,
        host,
        port,
        protocol,
        group_id,
        is_active
      })
    }

    return c.json({
      success: true,
      message: `成功创建 ${insertedNodes.length} 个节点`,
      data: { nodes: insertedNodes }
    })
  } catch (error: any) {
    console.error('批量创建EdgeTunnel节点失败:', error)
    return c.json({
      success: false,
      message: '批量创建节点失败: ' + (error.message || '未知错误')
    }, 500)
  }
})

// 创建EdgeTunnel节点
app.post('/', async (c) => {
  try {
    const payload = await getJwtPayload(c.req.raw, c.env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return c.json({ success: false, message: '权限不足' }, 403)
    }

    const db = getDB(c.env)
    const body = await c.req.json()
    
    const { name, host, port, protocol, group_id, is_active = 1, uuid, path = '/', country = '', city = '', flag_emoji = '', max_users = 100, sort_order = 0 } = body
    
    if (!name || !host || !port || !protocol || !group_id) {
      return c.json({
        success: false,
        message: '节点名称、主机地址、端口、协议和服务组不能为空'
      }, 400)
    }

    // 如果没有提供UUID，则生成一个
    const nodeUuid = uuid || generateUUID();

    const result = await db.prepare(`
      INSERT INTO edgetunnel_nodes (name, host, port, protocol, group_id, is_active, uuid, path, country, city, flag_emoji, max_users, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(name, host, port, protocol, group_id, is_active, nodeUuid, path, country, city, flag_emoji, max_users, sort_order).run()

    if (!result.success) {
      throw new Error('创建节点失败')
    }

    return c.json({
      success: true,
      message: '节点创建成功',
      data: { id: result.meta.last_row_id }
    })
  } catch (error: any) {
    console.error('创建EdgeTunnel节点失败:', error)
    return c.json({
      success: false,
      message: '创建节点失败: ' + (error.message || '未知错误')
    }, 500)
  }
})

// 更新EdgeTunnel节点
app.put('/:id', async (c) => {
  try {
    const payload = await getJwtPayload(c.req.raw, c.env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return c.json({ success: false, message: '权限不足' }, 403)
    }

    const db = getDB(c.env)
    const id = c.req.param('id')
    const body = await c.req.json()
    
    const { name, host, port, protocol, group_id, is_active } = body
    
    if (!name || !host || !port || !protocol || !group_id) {
      return c.json({
        success: false,
        message: '节点名称、主机地址、端口、协议和服务组不能为空'
      }, 400)
    }

    const result = await db.prepare(`
      UPDATE edgetunnel_nodes 
      SET name = ?, host = ?, port = ?, protocol = ?, group_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(name, host, port, protocol, group_id, is_active, id).run()

    if (!result.success) {
      throw new Error('更新节点失败')
    }

    return c.json({
      success: true,
      message: '节点更新成功'
    })
  } catch (error: any) {
    console.error('更新EdgeTunnel节点失败:', error)
    return c.json({
      success: false,
      message: '更新节点失败'
    }, 500)
  }
})

// 删除EdgeTunnel节点
app.delete('/:id', async (c) => {
  try {
    const payload = await getJwtPayload(c.req.raw, c.env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return c.json({ success: false, message: '权限不足' }, 403)
    }

    const db = getDB(c.env)
    const id = c.req.param('id')
    
    // 检查是否有关联的用户节点
    const userNodeCountResult = await db.prepare(`
      SELECT COUNT(*) as count FROM edgetunnel_user_nodes WHERE node_id = ?
    `).bind(id).first()

    if (userNodeCountResult && (userNodeCountResult as any).count > 0) {
      return c.json({
        success: false,
        message: '无法删除已分配给用户节点，请先取消所有用户分配'
      }, 400)
    }

    const result = await db.prepare(`
      DELETE FROM edgetunnel_nodes WHERE id = ?
    `).bind(id).run()

    if (!result.success) {
      throw new Error('删除节点失败')
    }

    return c.json({
      success: true,
      message: '节点删除成功'
    })
  } catch (error: any) {
    console.error('删除EdgeTunnel节点失败:', error)
    return c.json({
      success: false,
      message: '删除节点失败'
    }, 500)
  }
})

// 获取单个节点详情
app.get('/:id', async (c) => {
  try {
    const payload = await getJwtPayload(c.req.raw, c.env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return c.json({ success: false, message: '权限不足' }, 403)
    }

    const db = getDB(c.env)
    const id = c.req.param('id')
    
    const node = await db.prepare(`
      SELECT n.*, g.name as group_name
      FROM edgetunnel_nodes n
      LEFT JOIN edgetunnel_groups g ON n.group_id = g.id
      WHERE n.id = ?
    `).bind(id).first()

    if (!node) {
      return c.json({
        success: false,
        message: '节点不存在'
      }, 404)
    }

    return c.json({
      success: true,
      data: { node }
    })
  } catch (error: any) {
    console.error('获取EdgeTunnel节点详情失败:', error)
    return c.json({
      success: false,
      message: '获取节点详情失败'
    }, 500)
  }
})

export default app