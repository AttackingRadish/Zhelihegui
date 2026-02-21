-- 修复批次表约束问题

-- 1. user_id 改为可选（not null → nullable）
ALTER TABLE shipments ALTER COLUMN user_id DROP NOT NULL;

-- 2. product 改为可选（not null → nullable）
ALTER TABLE shipments ALTER COLUMN product DROP NOT NULL;

-- 3. route 改为可选（not null → nullable）
ALTER TABLE shipments ALTER COLUMN route DROP NOT NULL;

-- 4. estimated_arrival_time 改为可选（not null → nullable）
ALTER TABLE shipments ALTER COLUMN estimated_arrival_time DROP NOT NULL;

-- 5. 确保新字段已存在
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS current_temperature DECIMAL(5, 2);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS current_humidity DECIMAL(5, 2);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS product_type TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS customer_id INTEGER;

-- 6. 添加注释
COMMENT ON COLUMN shipments.user_id IS '用户ID（可选）';
COMMENT ON COLUMN shipments.product IS '产品名称（已弃用，使用product_type）';
COMMENT ON COLUMN shipments.product_type IS '产品类型';
COMMENT ON COLUMN shipments.current_temperature IS '当前温度';
COMMENT ON COLUMN shipments.current_humidity IS '当前湿度';
COMMENT ON COLUMN shipments.customer_id IS '客户ID';
