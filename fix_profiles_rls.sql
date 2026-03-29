-- 修复 profiles 表的 RLS 策略问题

-- 1. 检查 profiles 表中是否有数据
SELECT * FROM profiles LIMIT 10;

-- 2. 检查 profiles 表的 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 3. 禁用 RLS 策略（仅用于测试，生产环境不建议）
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 4. 或者创建允许匿名用户查询的策略
DROP POLICY IF EXISTS "Allow anonymous select" ON profiles;
CREATE POLICY "Allow anonymous select" ON profiles
  FOR SELECT
  TO anon
  USING (true);

-- 5. 创建允许匿名用户插入的策略
DROP POLICY IF EXISTS "Allow anonymous insert" ON profiles;
CREATE POLICY "Allow anonymous insert" ON profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 6. 创建允许匿名用户更新的策略
DROP POLICY IF EXISTS "Allow anonymous update" ON profiles;
CREATE POLICY "Allow anonymous update" ON profiles
  FOR UPDATE
  TO anon
  USING (true);

-- 7. 授予权限
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;

-- 8. 重新启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 9. 检查是否生效
SELECT * FROM profiles LIMIT 10;

-- 10. 手动创建用户 3 的资料（如果不存在）
INSERT INTO profiles (id, email, current_plan, membership_tier, subscription_status, subscription_start_date, subscription_end_date, created_at, updated_at)
VALUES (3, '1111111@qq.com', 'pro', 'pro', 'active', NOW(), NOW() + INTERVAL '1 month', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  current_plan = EXCLUDED.current_plan,
  membership_tier = EXCLUDED.membership_tier,
  subscription_status = EXCLUDED.subscription_status,
  subscription_start_date = EXCLUDED.subscription_start_date,
  subscription_end_date = EXCLUDED.subscription_end_date,
  updated_at = NOW();

-- 11. 手动创建用户 3 的账单记录（如果不存在）
INSERT INTO billing_records (user_id, plan_type, amount, payment_date, status, payment_status, payment_method, created_at)
VALUES (3, 'pro', 99.00, NOW(), 'paid', 'paid', 'wechat', NOW());

-- 12. 验证结果
SELECT * FROM profiles WHERE id = 3;
SELECT * FROM billing_records WHERE user_id = 3;