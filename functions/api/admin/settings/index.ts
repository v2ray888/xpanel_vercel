import { z } from 'zod'
import { getDB, getJwtPayload } from '../../../utils/db'

// Default settings configuration
const defaultSettings = {
  site_name: { value: 'XPanel', description: '站点名称' },
  site_description: { value: '专业的VPN管理面板', description: '站点描述' },
  site_keywords: { value: 'VPN,代理,翻墙', description: '站点关键词' },
  site_logo: { value: '', description: '站点Logo URL' },
  site_favicon: { value: '', description: '站点图标 URL' },
  admin_email: { value: 'admin@xpanel.com', description: '管理员邮箱' },
  currency: { value: 'CNY', description: '货币代码' },
  currency_symbol: { value: '¥', description: '货币符号' },
  registration_enabled: { value: '1', description: '是否允许注册' },
  email_verification_required: { value: '0', description: '是否需要邮箱验证' },
  max_devices_per_user: { value: '5', description: '每个用户最大设备数' },
  default_plan_id: { value: '1', description: '默认套餐ID' },
  referral_enabled: { value: '0', description: '是否启用推荐系统' },
  referral_bonus: { value: '0', description: '推荐奖励金额' },
  maintenance_mode: { value: '0', description: '是否处于维护模式' },
  maintenance_message: { value: '系统维护中，请稍后再试', description: '维护模式消息' }
}

const settingUpdateSchema = z.object({
  site_name: z.string().min(1, '站点名称不能为空').optional(),
  site_description: z.string().optional(),
  site_keywords: z.string().optional(),
  site_logo: z.string().optional(),
  site_favicon: z.string().optional(),
  admin_email: z.string().email('管理员邮箱格式不正确').optional(),
  currency: z.string().min(1, '货币不能为空').optional(),
  currency_symbol: z.string().min(1, '货币符号不能为空').optional(),
  registration_enabled: z.preprocess((val) => (val === true || val === 1 || val === 'true' ? '1' : '0'), z.string()).optional(),
  email_verification_required: z.preprocess((val) => (val === true || val === 1 || val === 'true' ? '1' : '0'), z.string()).optional(),
  max_devices_per_user: z.preprocess((val) => val?.toString(), z.string().regex(/^\d+$/, '必须为数字')).optional(),
  default_plan_id: z.preprocess((val) => val?.toString(), z.string().regex(/^\d+$/, '必须为数字')).optional(),
  referral_enabled: z.preprocess((val) => (val === true || val === 1 || val === 'true' ? '1' : '0'), z.string()).optional(),
  referral_bonus: z.preprocess((val) => val?.toString(), z.string().regex(/^\d+(\.\d+)?$/, '必须为数字')).optional(),
  maintenance_mode: z.preprocess((val) => (val === true || val === 1 || val === 'true' ? '1' : '0'), z.string()).optional(),
  maintenance_message: z.string().optional(),
})

// GET /api/admin/settings
export const onRequestGet: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { request, env } = context;
    
    // JWT verification
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return new Response(JSON.stringify({ success: false, message: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDB(env);
    
    // Get all settings from database
    const dbSettings = await db.prepare(
      'SELECT key, value, description FROM settings'
    ).all()

    // Convert to object format
    const settingsMap: Record<string, any> = {}
    if (dbSettings.results) {
      dbSettings.results.forEach((row: any) => {
        settingsMap[row.key] = {
          value: row.value,
          description: row.description
        }
      })
    }

    // Merge with defaults for missing settings
    const mergedSettings: Record<string, any> = {}
    Object.entries(defaultSettings).forEach(([key, defaultSetting]) => {
      if (settingsMap[key]) {
        mergedSettings[key] = settingsMap[key]
      } else {
        mergedSettings[key] = defaultSetting
      }
    })

    // Convert to frontend format
    const frontendSettings: Record<string, any> = {}
    Object.entries(mergedSettings).forEach(([key, setting]) => {
      frontendSettings[key] = setting.value
    })

    const response = new Response(JSON.stringify({
      success: true,
      data: frontendSettings,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
    return response;
  } catch (error: any) {
    console.error('Get settings error:', error)
    return new Response(JSON.stringify({ success: false, message: '获取设置失败: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PUT /api/admin/settings
export const onRequestPut: PagesFunction<{ DB: D1Database; JWT_SECRET: string }> = async (context) => {
  try {
    const { request, env } = context;
    
    // JWT verification
    const payload = await getJwtPayload(request, env.JWT_SECRET);
    if (!payload || payload.role !== 1) {
      return new Response(JSON.stringify({ success: false, message: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json()
    const parsedBody = settingUpdateSchema.safeParse(body)

    if (!parsedBody.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: '请求参数无效', 
        errors: parsedBody.error.errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDB(env);
    
    // Update each setting individually
    const updatePromises = Object.entries(parsedBody.data).map(async ([key, value]) => {
      if (value !== undefined) {
        const defaultValue = defaultSettings[key as keyof typeof defaultSettings]
        if (!defaultValue) {
          return null // Skip unknown keys
        }

        // Check if setting exists
        const existingSetting = await db.prepare(
          'SELECT key FROM settings WHERE key = ?'
        ).bind(key).first()

        if (existingSetting) {
          // Update existing setting
          return db.prepare(`
            UPDATE settings 
            SET value = ?, updated_at = datetime("now")
            WHERE key = ?
          `).bind(value.toString(), key).run()
        } else {
          // Insert new setting
          return db.prepare(`
            INSERT INTO settings (key, value, description, created_at, updated_at)
            VALUES (?, ?, ?, datetime("now"), datetime("now"))
          `).bind(key, value.toString(), defaultValue.description).run()
        }
      }
      return null
    })

    await Promise.all(updatePromises)

    // Get updated settings
    const updatedSettings = await db.prepare(
      'SELECT key, value FROM settings'
    ).all()

    const settingsMap: Record<string, any> = {}
    if (updatedSettings.results) {
      updatedSettings.results.forEach((row: any) => {
        settingsMap[row.key] = row.value
      })
    }

    // Merge with defaults for missing settings
    const finalSettings: Record<string, any> = {}
    Object.entries(defaultSettings).forEach(([key, defaultSetting]) => {
      if (settingsMap[key]) {
        finalSettings[key] = settingsMap[key]
      } else {
        finalSettings[key] = defaultSetting.value
      }
    })

    const response = new Response(JSON.stringify({
      success: true,
      message: '设置更新成功',
      data: finalSettings,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
    return response;
  } catch (error: any) {
    console.error('Update settings error:', error)
    return new Response(JSON.stringify({ success: false, message: '更新设置失败: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// OPTIONS /api/admin/settings (for CORS preflight)
export const onRequestOptions: PagesFunction = async (context) => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}