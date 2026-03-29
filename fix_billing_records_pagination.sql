-- 检查 billing_records 表的总记录数
SELECT COUNT(*) as total_count FROM billing_records;

-- 检查 billing_records 表的 RLS 策略是否限制了查询
SELECT * FROM pg_policies WHERE tablename = 'billing_records';

-- 检查表的行级安全设置
SELECT relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname = 'billing_records';

-- 禁用 RLS 策略以获取所有记录
ALTER TABLE billing_records DISABLE ROW LEVEL SECURITY;

-- 再次检查总记录数
SELECT COUNT(*) as total_count FROM billing_records;

-- 查看所有不同的 user_id
SELECT DISTINCT user_id FROM billing_records ORDER BY user_id;

-- 查看每个 user_id 的记录数
SELECT user_id, COUNT(*) as count FROM billing_records GROUP BY user_id ORDER BY user_id;

-- 重新启用 RLS
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;

-- 创建允许匿名用户查询所有记录的策略（不限制行数）
DROP POLICY IF EXISTS "Allow anonymous select all on billing_records" ON billing_records;
CREATE POLICY "Allow anonymous select all on billing_records" ON billing_records
  FOR SELECT
  TO anon
  USING (true);

-- 授予权限
GRANT ALL ON billing_records TO anon;
GRANT ALL ON billing_records TO authenticated;