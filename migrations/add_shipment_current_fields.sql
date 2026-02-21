-- 添加批次当前状态字段
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS current_temperature DECIMAL(5, 2);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS current_humidity DECIMAL(5, 2);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS product_type TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS customer_id INTEGER;

-- 为现有数据设置默认值
UPDATE shipments SET product_type = product WHERE product_type IS NULL;

-- 添加注释
COMMENT ON COLUMN shipments.current_temperature IS '当前温度';
COMMENT ON COLUMN shipments.current_humidity IS '当前湿度';
COMMENT ON COLUMN shipments.product_type IS '产品类型';
COMMENT ON COLUMN shipments.customer_id IS '客户ID';
