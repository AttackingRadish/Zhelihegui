# 批次创建测试验证

## 1. 数据库表验证

所有必需的表已创建：
- ✅ shipments (批次表)
- ✅ shipment_status_history (状态历史)
- ✅ shipment_locations (位置追踪)
- ✅ shipment_events (事件日志)
- ✅ shipment_tags (标签)
- ✅ shipment_devices (设备关联)

## 2. 数据库字段验证

### shipments 表必填字段：
- ✅ id (自动生成)
- ✅ shipment_number (批次号)
- ✅ quantity (数量)
- ✅ origin (发货地)
- ✅ destination (目的地)
- ✅ departure_time (出发时间)
- ✅ packaging (包装)
- ✅ temperature_requirement (温度要求)
- ✅ status (状态，默认 'pending')
- ✅ risk_level (风险等级，默认 'low')
- ✅ created_at (自动生成)
- ✅ updated_at (自动生成)

### 可选字段：
- ✅ user_id (用户ID)
- ✅ product (产品名称)
- ✅ product_type (产品类型)
- ✅ route (路线)
- ✅ estimated_arrival_time (预计到达时间)
- ✅ actual_arrival_time (实际到达时间)
- ✅ current_temperature (当前温度)
- ✅ current_humidity (当前湿度)
- ✅ customer_id (客户ID)

## 3. API 测试结果

### 创建批次 API 测试
**请求：**
```json
{
  "shipmentNumber": "SHP-API-TEST-001",
  "productType": "seafood",
  "quantity": 50,
  "origin": "台州",
  "destination": "上海",
  "departureTime": "2025-01-20T10:00:00",
  "estimatedArrivalTime": "2025-01-21T08:00:00",
  "temperatureRequirement": -2.0,
  "packaging": "refrigerated_container",
  "customerId": null,
  "tags": ["VIP", "加急"],
  "deviceId": "DEVICE-001"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "shipment_number": "SHP-API-TEST-001",
    "product_type": "seafood",
    "quantity": 50,
    "origin": "台州",
    "destination": "上海",
    "departure_time": "2025-01-20T10:00:00+08:00",
    "estimated_arrival_time": "2025-01-21T08:00:00+08:00",
    "packaging": "refrigerated_container",
    "temperature_requirement": -2,
    "status": "pending",
    "risk_level": "low",
    ...
  },
  "message": "批次创建成功"
}
```

**验证结果：**
- ✅ 批次创建成功
- ✅ 标签创建成功 (VIP, 加急)
- ✅ 设备创建成功 (DEVICE-001)
- ✅ 状态历史创建成功

## 4. 前端使用步骤

### 步骤 1: 访问新建批次页面
浏览器打开：`http://localhost:5000/shipments/new`

### 步骤 2: 填写表单
- **批次号**: SHP-2025-001
- **产品类型**: 海鲜
- **数量**: 50
- **发货地**: 台州
- **目的地**: 上海
- **出发时间**: 选择日期和时间
- **温度要求**: -2.0
- **包装类型**: 冷藏集装箱
- **标签**: VIP,加急 (可选)

### 步骤 3: 点击"创建批次"按钮
- 系统将调用 API 创建批次
- 成功后自动跳转到批次详情页

### 步骤 4: 查看批次列表
访问：`http://localhost:5000/shipments`

### 步骤 5: 生成模拟数据（可选）
在批次详情页点击"生成模拟数据"按钮，生成 20 条温度历史记录

### 步骤 6: 运行 AI 预测
在批次详情页点击"AI 预测"按钮，获取风险分析结果

## 5. 故障排查

### 如果前端页面无法提交：
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签页是否有 JavaScript 错误
3. 查看 Network 标签页，确认 API 请求是否发送
4. 检查 API 响应状态码和内容

### 如果 API 返回错误：
1. 检查表单数据是否完整
2. 查看服务器日志：`tail -f /app/work/logs/bypass/console.log`
3. 确认 Supabase 数据库连接正常

### 如果批次创建成功但看不到：
1. 检查批次列表页面的筛选条件
2. 确认批次状态（pending/in_transit/delivered）
3. 刷新页面重新加载数据

## 6. 数据库查询验证

```sql
-- 查看所有批次
SELECT * FROM shipments ORDER BY created_at DESC;

-- 查看某个批次的标签
SELECT * FROM shipment_tags WHERE shipment_id = ?;

-- 查看某个批次的设备
SELECT * FROM shipment_devices WHERE shipment_id = ?;

-- 查看某个批次的温度事件
SELECT * FROM shipment_events
WHERE shipment_id = ? AND event_type = 'temperature_reading'
ORDER BY timestamp DESC;
```

## 7. API 端点列表

- `GET /api/shipments/list` - 获取批次列表
- `POST /api/shipments/create` - 创建新批次
- `GET /api/shipments/[id]/detail` - 获取批次详情
- `POST /api/predict` - AI 风险预测
- `POST /api/data/ingest` - 数据采集
- `GET /api/data/ingest?shipmentId=X&count=20` - 生成模拟数据

## 8. 状态说明

- `pending` - 待出发
- `in_transit` - 运输中
- `delivered` - 已送达

## 9. 风险等级

- `low` - 低风险
- `medium` - 中等风险
- `high` - 高风险
- `critical` - 严重风险
