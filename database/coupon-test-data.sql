-- 添加测试优惠码数据
INSERT INTO coupons (code, name, description, type, value, min_amount, usage_limit, user_limit, is_active, created_by)
VALUES 
('WELCOME10', '新用户欢迎', '新用户专享9折优惠', 1, 9.0, 50, 100, 1, 1, 1),
('SAVE20', '满减优惠', '满100减20元', 2, 20, 100, 50, 1, 1, 1),
('VIP50', 'VIP专享', 'VIP用户5折优惠', 1, 5.0, 200, 10, 1, 1, 1),
('DOUBLE11', '双十一特惠', '双十一8折优惠', 1, 8.0, 100, 1000, 1, 1, 1),
('FIRST30', '首单立减', '首单减30元', 2, 30, 150, 200, 1, 1, 1)
ON CONFLICT(code) DO NOTHING;