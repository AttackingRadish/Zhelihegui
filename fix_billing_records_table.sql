-- 修复 billing_records 表结构

-- 1. 如果表不存在，创建它
CREATE TABLE IF NOT EXISTS billing_records (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    plan_type TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'paid',
    payment_status TEXT DEFAULT 'paid',
    payment_method TEXT DEFAULT 'unknown',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    payjs_order_id TEXT,
    order_id TEXT
);

-- 2. 如果表存在，添加缺失的字段
ALTER TABLE billing_records ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid';
ALTER TABLE billing_records ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'unknown';
ALTER TABLE billing_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE billing_records ADD COLUMN IF NOT EXISTS payjs_order_id TEXT;
ALTER TABLE billing_records ADD COLUMN IF NOT EXISTS order_id TEXT;

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_billing_records_user_id ON billing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_payment_date ON billing_records(payment_date);

-- 4. 验证表结构
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'billing_records';

-- 5. 测试插入操作
INSERT INTO billing_records (user_id, plan_type, amount, payment_date, status, payment_status, payment_method)
VALUES (2, 'pro', 99.00, NOW(), 'paid', 'paid', 'wechat')
RETURNING *;