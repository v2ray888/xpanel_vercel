-- EdgeTunnel 数据库结构
-- 创建 EdgeTunnel 服务组表
CREATE TABLE IF NOT EXISTS edgetunnel_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  api_endpoint TEXT NOT NULL,
  api_key TEXT NOT NULL,
  max_users INTEGER DEFAULT 100,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建 EdgeTunnel 节点表
CREATE TABLE IF NOT EXISTS edgetunnel_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  uuid TEXT NOT NULL,
  path TEXT DEFAULT '/',
  country TEXT DEFAULT '',
  city TEXT DEFAULT '',
  flag_emoji TEXT DEFAULT '',
  max_users INTEGER DEFAULT 100,
  current_users INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES edgetunnel_groups(id) ON DELETE CASCADE
);

-- 创建 EdgeTunnel 用户分配表
CREATE TABLE IF NOT EXISTS edgetunnel_user_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  node_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 添加缺失的字段
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 添加缺失的字段
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (node_id) REFERENCES edgetunnel_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES edgetunnel_groups(id) ON DELETE CASCADE,
  UNIQUE(user_id, node_id)
);

-- 创建 EdgeTunnel 流量日志表
CREATE TABLE IF NOT EXISTS edgetunnel_traffic_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  node_id INTEGER NOT NULL,
  upload_bytes INTEGER DEFAULT 0,
  download_bytes INTEGER DEFAULT 0,
  total_bytes INTEGER DEFAULT 0,
  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (node_id) REFERENCES edgetunnel_nodes(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_edgetunnel_nodes_group_id ON edgetunnel_nodes(group_id);
CREATE INDEX IF NOT EXISTS idx_edgetunnel_nodes_active ON edgetunnel_nodes(is_active);
CREATE INDEX IF NOT EXISTS idx_edgetunnel_user_nodes_user_id ON edgetunnel_user_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_edgetunnel_user_nodes_node_id ON edgetunnel_user_nodes(node_id);
CREATE INDEX IF NOT EXISTS idx_edgetunnel_user_nodes_active ON edgetunnel_user_nodes(is_active);
CREATE INDEX IF NOT EXISTS idx_edgetunnel_traffic_logs_user_id ON edgetunnel_traffic_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_edgetunnel_traffic_logs_node_id ON edgetunnel_traffic_logs(node_id);