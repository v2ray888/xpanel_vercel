-- User table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    status TINYINT DEFAULT 1, -- 1:正常 0:禁用
    role TINYINT DEFAULT 0, -- 0:普通用户 1:管理员
    referrer_id INTEGER, -- 推荐人ID
    referral_code VARCHAR(20) UNIQUE, -- 推广码
    balance DECIMAL(10,2) DEFAULT 0, -- 账户余额
    commission_balance DECIMAL(10,2) DEFAULT 0, -- 佣金余额
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id)
);

-- 套餐表
CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2), -- 原价
    duration_days INTEGER NOT NULL, -- 有效天数
    traffic_gb INTEGER NOT NULL, -- 流量GB
    device_limit INTEGER DEFAULT 3,
    features TEXT, -- JSON格式的特性列表
    sort_order INTEGER DEFAULT 0,
    is_active TINYINT DEFAULT 1,
    is_public TINYINT DEFAULT 1, -- 是否公开可见
    is_popular TINYINT DEFAULT 0, -- 是否推荐
    edgetunnel_group_id INTEGER, -- EdgeTunnel 服务组ID (保留以兼容旧数据)
    edgetunnel_group_ids TEXT, -- EdgeTunnel 服务组ID数组
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (edgetunnel_group_id) REFERENCES edgetunnel_groups(id)
);

-- 用户订阅表
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    status TINYINT DEFAULT 1, -- 1:有效 0:过期 2:暂停
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    traffic_used BIGINT DEFAULT 0, -- 已用流量(字节)
    traffic_total BIGINT NOT NULL, -- 总流量(字节)
    device_limit INTEGER DEFAULT 3, -- 设备数限制
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- 服务器节点表
CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    protocol VARCHAR(20) NOT NULL, -- ss, v2ray, trojan, hysteria
    method VARCHAR(50), -- 加密方式
    password VARCHAR(255),
    uuid VARCHAR(255),
    path VARCHAR(255),
    country VARCHAR(50),
    city VARCHAR(50),
    flag_emoji VARCHAR(10),
    load_balance INTEGER DEFAULT 0, -- 负载权重
    max_users INTEGER DEFAULT 1000, -- 最大用户数
    device_limit INTEGER DEFAULT 3, -- 设备数限制
    current_users INTEGER DEFAULT 0, -- 当前用户数
    sort_order INTEGER DEFAULT 0, -- 排序
    is_active TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 兑换码表
CREATE TABLE IF NOT EXISTS redemption_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    plan_id INTEGER NOT NULL,
    status TINYINT DEFAULT 0, -- 0:未使用 1:已使用 2:已过期
    used_by INTEGER, -- 使用者ID
    used_at DATETIME,
    expires_at DATETIME,
    created_by INTEGER NOT NULL, -- 创建者ID
    batch_id VARCHAR(50), -- 批次ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id),
    FOREIGN KEY (used_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0, -- 折扣金额
    final_amount DECIMAL(10,2) NOT NULL, -- 最终金额
    status TINYINT DEFAULT 0, -- 0:待支付 1:已支付 2:已取消 3:已退款
    payment_method VARCHAR(20), -- alipay, wechat, paypal
    payment_id VARCHAR(100), -- 第三方支付ID
    paid_at DATETIME,
    expires_at DATETIME, -- 订单过期时间
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- 推广佣金表
CREATE TABLE IF NOT EXISTS referral_commissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER NOT NULL, -- 推荐人ID
    referee_id INTEGER NOT NULL, -- 被推荐人ID
    order_id INTEGER NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL, -- 佣金比例
    commission_amount DECIMAL(10,2) NOT NULL, -- 佣金金额
    status TINYINT DEFAULT 0, -- 0:待结算 1:已结算 2:已提现
    settled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id),
    FOREIGN KEY (referee_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 用户流量记录表
CREATE TABLE IF NOT EXISTS user_traffic_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    server_id INTEGER NOT NULL,
    upload_bytes BIGINT DEFAULT 0,
    download_bytes BIGINT DEFAULT 0,
    total_bytes BIGINT DEFAULT 0,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (server_id) REFERENCES servers(id)
);

-- 系统设置表
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 公告表
CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type TINYINT DEFAULT 0, -- 0:普通 1:重要 2:紧急
    is_active TINYINT DEFAULT 1,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_code ON redemption_codes(code);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_status ON redemption_codes(status);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_traffic_logs_user_id ON user_traffic_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_traffic_logs_recorded_at ON user_traffic_logs(recorded_at);

-- 提现申请表
CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL, -- alipay, wechat, bank
    payment_account VARCHAR(255) NOT NULL, -- 收款账户
    real_name VARCHAR(100) NOT NULL, -- 真实姓名
    status TINYINT DEFAULT 0, -- 0:待审核 1:已通过 2:已拒绝
    admin_note TEXT,
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 为提现表创建索引
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
