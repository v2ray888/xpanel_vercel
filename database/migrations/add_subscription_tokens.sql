-- 订阅Token管理表
CREATE TABLE IF NOT EXISTS subscription_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subscription_id INTEGER NOT NULL,
    token_hash VARCHAR(255) NOT NULL, -- Token的SHA256哈希值
    expires_at DATETIME NOT NULL,
    is_active TINYINT DEFAULT 1, -- 1:有效 0:已撤销
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_subscription_tokens_user_id ON subscription_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_tokens_subscription_id ON subscription_tokens(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_tokens_token_hash ON subscription_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_subscription_tokens_active ON subscription_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_tokens_expires_at ON subscription_tokens(expires_at);

-- 确保每个用户每个订阅只有一个有效Token
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_tokens_unique_active 
ON subscription_tokens(user_id, subscription_id, is_active) 
WHERE is_active = 1;