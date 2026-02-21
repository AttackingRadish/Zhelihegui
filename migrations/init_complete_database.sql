-- 完整数据库初始化脚本
-- 用于初始化 AI 预测性冷链合规系统的所有表

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT,
  plan TEXT NOT NULL DEFAULT 'basic',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. 批次表 (shipments)
-- ============================================
CREATE TABLE IF NOT EXISTS shipments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  shipment_number TEXT NOT NULL UNIQUE,
  product TEXT,
  product_type TEXT,
  quantity INTEGER NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_arrival_time TIMESTAMP WITH TIME ZONE,
  actual_arrival_time TIMESTAMP WITH TIME ZONE,
  route JSONB,
  packaging TEXT NOT NULL,
  temperature_requirement DECIMAL(5, 2) NOT NULL,
  current_temperature DECIMAL(5, 2),
  current_humidity DECIMAL(5, 2),
  customer_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  risk_level TEXT NOT NULL DEFAULT 'low',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. 温度记录表 (temperature_records)
-- ============================================
CREATE TABLE IF NOT EXISTS temperature_records (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  temperature DECIMAL(5, 2) NOT NULL,
  humidity DECIMAL(5, 2),
  location JSONB,
  weather_condition TEXT,
  traffic_condition TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  device_id TEXT,
  is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
  anomaly_score DECIMAL(3, 2)
);

-- ============================================
-- 4. 风险预测表 (risk_predictions)
-- ============================================
CREATE TABLE IF NOT EXISTS risk_predictions (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  prediction_time TIMESTAMP WITH TIME ZONE NOT NULL,
  prediction_window INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  risk_score DECIMAL(3, 2) NOT NULL,
  temperature_deviation DECIMAL(5, 2),
  confidence DECIMAL(3, 2) NOT NULL,
  factors JSONB NOT NULL,
  recommendations JSONB,
  is_realized BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. 风险预警表 (risk_alerts)
-- ============================================
CREATE TABLE IF NOT EXISTS risk_alerts (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  risk_prediction_id INTEGER REFERENCES risk_predictions(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  detail JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_handled BOOLEAN NOT NULL DEFAULT FALSE,
  handled_at TIMESTAMP WITH TIME ZONE,
  handle_action TEXT,
  alerted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. 批次状态历史表 (shipment_status_history)
-- ============================================
CREATE TABLE IF NOT EXISTS shipment_status_history (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  reason TEXT,
  changed_by INTEGER REFERENCES users(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB,
  notes TEXT
);

-- ============================================
-- 7. 批次位置追踪表 (shipment_locations)
-- ============================================
CREATE TABLE IF NOT EXISTS shipment_locations (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  speed DECIMAL(6, 2),
  heading DECIMAL(5, 2),
  device_id TEXT
);

-- ============================================
-- 8. 批次事件日志表 (shipment_events)
-- ============================================
CREATE TABLE IF NOT EXISTS shipment_events (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  description TEXT,
  event_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  triggered_by TEXT,
  severity TEXT
);

-- ============================================
-- 9. 批次标签表 (shipment_tags)
-- ============================================
CREATE TABLE IF NOT EXISTS shipment_tags (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 10. 批次设备关联表 (shipment_devices)
-- ============================================
CREATE TABLE IF NOT EXISTS shipment_devices (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  detached_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 11. 团队成员表 (team_members)
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

COMMENT ON TABLE team_members IS '团队成员表';
COMMENT ON COLUMN team_members.role IS '角色: admin/member';

-- ============================================
-- 创建索引
-- ============================================
-- users 表索引
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);

-- shipments 表索引
CREATE INDEX IF NOT EXISTS shipments_user_id_idx ON shipments(user_id);
CREATE INDEX IF NOT EXISTS shipments_status_idx ON shipments(status);
CREATE INDEX IF NOT EXISTS shipments_departure_time_idx ON shipments(departure_time);
CREATE INDEX IF NOT EXISTS shipments_shipment_number_idx ON shipments(shipment_number);

-- temperature_records 表索引
CREATE INDEX IF NOT EXISTS temperature_records_shipment_id_idx ON temperature_records(shipment_id);
CREATE INDEX IF NOT EXISTS temperature_records_timestamp_idx ON temperature_records(timestamp);
CREATE INDEX IF NOT EXISTS temperature_records_device_id_idx ON temperature_records(device_id);

-- risk_predictions 表索引
CREATE INDEX IF NOT EXISTS risk_predictions_shipment_id_idx ON risk_predictions(shipment_id);
CREATE INDEX IF NOT EXISTS risk_predictions_prediction_time_idx ON risk_predictions(prediction_time);
CREATE INDEX IF NOT EXISTS risk_predictions_risk_level_idx ON risk_predictions(risk_level);

-- risk_alerts 表索引
CREATE INDEX IF NOT EXISTS risk_alerts_shipment_id_idx ON risk_alerts(shipment_id);
CREATE INDEX IF NOT EXISTS risk_alerts_risk_prediction_id_idx ON risk_alerts(risk_prediction_id);
CREATE INDEX IF NOT EXISTS risk_alerts_severity_idx ON risk_alerts(severity);
CREATE INDEX IF NOT EXISTS risk_alerts_is_read_idx ON risk_alerts(is_read);

-- shipment_status_history 表索引
CREATE INDEX IF NOT EXISTS shipment_status_history_shipment_id_idx ON shipment_status_history(shipment_id);
CREATE INDEX IF NOT EXISTS shipment_status_history_timestamp_idx ON shipment_status_history(timestamp);
CREATE INDEX IF NOT EXISTS shipment_status_history_to_status_idx ON shipment_status_history(to_status);

-- shipment_locations 表索引
CREATE INDEX IF NOT EXISTS shipment_locations_shipment_id_idx ON shipment_locations(shipment_id);
CREATE INDEX IF NOT EXISTS shipment_locations_timestamp_idx ON shipment_locations(timestamp);
CREATE INDEX IF NOT EXISTS shipment_locations_device_id_idx ON shipment_locations(device_id);

-- shipment_events 表索引
CREATE INDEX IF NOT EXISTS shipment_events_shipment_id_idx ON shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS shipment_events_timestamp_idx ON shipment_events(timestamp);
CREATE INDEX IF NOT EXISTS shipment_events_event_type_idx ON shipment_events(event_type);

-- shipment_tags 表索引
CREATE INDEX IF NOT EXISTS shipment_tags_shipment_id_idx ON shipment_tags(shipment_id);
CREATE INDEX IF NOT EXISTS shipment_tags_tag_name_idx ON shipment_tags(tag_name);

-- shipment_devices 表索引
CREATE INDEX IF NOT EXISTS shipment_devices_shipment_id_idx ON shipment_devices(shipment_id);
CREATE INDEX IF NOT EXISTS shipment_devices_device_id_idx ON shipment_devices(device_id);
CREATE INDEX IF NOT EXISTS shipment_devices_status_idx ON shipment_devices(status);

-- team_members 表索引
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_role_idx ON team_members(role);

-- ============================================
-- 添加注释
-- ============================================
COMMENT ON TABLE users IS '用户表';
COMMENT ON TABLE shipments IS '批次表';
COMMENT ON TABLE temperature_records IS '温度记录表';
COMMENT ON TABLE risk_predictions IS '风险预测表';
COMMENT ON TABLE risk_alerts IS '风险预警表';
COMMENT ON TABLE shipment_status_history IS '批次状态历史表';
COMMENT ON TABLE shipment_locations IS '批次位置追踪表';
COMMENT ON TABLE shipment_events IS '批次事件日志表';
COMMENT ON TABLE shipment_tags IS '批次标签表';
COMMENT ON TABLE shipment_devices IS '批次设备关联表';

COMMENT ON COLUMN shipments.current_temperature IS '当前温度';
COMMENT ON COLUMN shipments.current_humidity IS '当前湿度';
COMMENT ON COLUMN shipments.product_type IS '产品类型';
COMMENT ON COLUMN shipments.customer_id IS '客户ID';
COMMENT ON COLUMN shipments.user_id IS '用户ID（可选）';

-- ============================================
-- 初始化完成
-- ============================================
-- 执行此脚本后，数据库将包含所有必需的表和索引
-- 可以开始使用系统创建批次和管理冷链运输
