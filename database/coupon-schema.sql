-- 优惠码表
CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL, -- 优惠码
    name VARCHAR(100) NOT NULL, -- 优惠码名称
    description TEXT, -- 描述
    type TINYINT NOT NULL DEFAULT 1, -- 1:折扣 2:固定金额
    value DECIMAL(10,2) NOT NULL, -- 折扣值(1-10表示折扣，>10表示固定金额)
    min_amount DECIMAL(10,2) DEFAULT 0, -- 最低消费金额
    max_discount DECIMAL(10,2), -- 最大折扣金额(仅折扣类型有效)
    usage_limit INTEGER DEFAULT -1, -- 使用次数限制(-1表示无限制)
    used_count INTEGER DEFAULT 0, -- 已使用次数
    user_limit INTEGER DEFAULT 1, -- 每用户使用次数限制
    start_date DATETIME, -- 开始时间
    end_date DATETIME, -- 结束时间
    is_active TINYINT DEFAULT 1, -- 是否启用
    created_by INTEGER NOT NULL, -- 创建者ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 优惠码使用记录表
CREATE TABLE IF NOT EXISTS coupon_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coupon_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL, -- 实际折扣金额
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 为优惠码表创建索引
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_start_end_date ON coupons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order_id ON coupon_usage(order_id);