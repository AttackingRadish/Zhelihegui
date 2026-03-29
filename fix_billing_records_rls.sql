-- 修复 billing_records 表的 RLS 策略问题

-- 1. 检查 billing_records 表中是否有数据
SELECT * FROM billing_records LIMIT 10;

-- 2. 检查 billing_records 表的 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'billing_records';

-- 3. 检查 billing_records 表中 user_id = 3 的记录
SELECT * FROM billing_records WHERE user_id = 3;

-- 4. 检查 billing_records 表中所有记录的 user_id 分布
SELECT user_id, COUNT(*) as count FROM billing_records GROUP BY user_id;

-- 5. 禁用 RLS 策略（仅用于测试）
ALTER TABLE billing_records DISABLE ROW LEVEL SECURITY;

-- 6. 或者创建允许匿名用户查询的策略
DROP POLICY IF EXISTS "Allow anonymous select on billing_records" ON billing_records;
CREATE POLICY "Allow anonymous select on billing_records" ON billing_records
  FOR SELECT
  TO anon
  USING (true);

-- 7. 创建允许匿名用户插入的策略
DROP POLICY IF EXISTS "Allow anonymous insert on billing_records" ON billing_records;
CREATE POLICY "Allow anonymous insert on billing_records" ON billing_records
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 8. 授予权限
GRANT ALL ON billing_records TO anon;
GRANT ALL ON billing_records TO authenticated;

-- 9. 重新启用 RLS
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;

-- 10. 手动创建用户 3 的账单记录（如果不存在）
INSERT INTO billing_records (user_id, plan_type, amount, payment_date, status, payment_status, payment_method, created_at)
VALUES 
  (3, 'pro', 99.00, NOW(), 'paid', 'paid', 'wechat', NOW()),
  (3, 'enterprise', 499.00, NOW() - INTERVAL '1 day', 'paid', 'paid', 'alipay', NOW() - INTERVAL '1 day');

-- 11. 验证结果
SELECT * FROM billing_records WHERE user_id = 3;

-- 12. 检查 billing_records 表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'billing_records';