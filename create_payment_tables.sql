-- 创建支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
    id TEXT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_type TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'wechat',
    payjs_order_id TEXT,
    wechat_order_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    notify_data JSONB,
    error_msg TEXT,
    openid TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_payjs_order_id ON payment_orders(payjs_order_id);

-- 修改 billing_records 表，添加支付相关字段
ALTER TABLE billing_records 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'wechat',
ADD COLUMN IF NOT EXISTS payjs_order_id TEXT,
ADD COLUMN IF NOT EXISTS order_id TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_billing_records_order_id ON billing_records(order_id);

-- 添加注释
COMMENT ON TABLE payment_orders IS '支付订单表，记录所有支付请求';
COMMENT ON COLUMN payment_orders.id IS '系统订单号';
COMMENT ON COLUMN payment_orders.payjs_order_id IS 'PayJS订单号';
COMMENT ON COLUMN payment_orders.status IS '订单状态: pending-待支付, paid-已支付, expired-已过期, failed-失败';
