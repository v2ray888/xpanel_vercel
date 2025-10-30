-- 插入测试推广数据

-- 插入测试用户
INSERT OR IGNORE INTO users (id, email, password_hash, username, role, referrer_id, referral_code, commission_balance, created_at) VALUES
(2, 'user1@example.com', '$2b$10$r80kFi4KQZ9wwu3kje/aPOFgkA6yjccMdeDDfnmH2yFKwt6ipxRam', 'User One', 0, 1, 'USER001', 15.50, datetime('now', '-10 days')),
(3, 'user2@example.com', '$2b$10$r80kFi4KQZ9wwu3kje/aPOFgkA6yjccMdeDDfnmH2yFKwt6ipxRam', 'User Two', 0, 1, 'USER002', 8.20, datetime('now', '-8 days'));

-- 插入测试订单
INSERT OR IGNORE INTO orders (id, order_no, user_id, plan_id, amount, final_amount, status, payment_method, paid_at, created_at) VALUES
(1, 'ORDER001', 2, 1, 10.00, 10.00, 1, 'alipay', datetime('now', '-9 days'), datetime('now', '-10 days')),
(2, 'ORDER002', 3, 2, 27.00, 27.00, 1, 'wechat', datetime('now', '-7 days'), datetime('now', '-8 days'));

-- 插入推广佣金记录
INSERT OR IGNORE INTO referral_commissions (id, referrer_id, referee_id, order_id, commission_rate, commission_amount, status, settled_at, created_at) VALUES
(1, 1, 2, 1, 10.00, 1.00, 1, datetime('now', '-8 days'), datetime('now', '-9 days')),
(2, 1, 3, 2, 10.00, 2.70, 0, NULL, datetime('now', '-7 days'));

-- 更新管理员佣金余额
UPDATE users SET commission_balance = 3.70 WHERE id = 1;