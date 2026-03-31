-- 检查用户 3 的账单记录详情
SELECT * FROM billing_records WHERE user_id = 3;

-- 检查 billing_records 表的 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'billing_records';

-- 检查是否有针对 user_id 的特定策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'billing_records';

-- 禁用 RLS 后查看用户 3 的记录
ALTER TABLE billing_records DISABLE ROW LEVEL SECURITY;
SELECT * FROM billing_records WHERE user_id = 3;

-- 检查 user_id 字段的数据类型
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns 
WHERE table_name = 'billing_records' AND column_name = 'user_id';

-- 检查是否有类型不匹配的问题
SELECT user_id, pg_typeof(user_id) as user_id_type FROM billing_records LIMIT 5;

-- 重新启用 RLS
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;