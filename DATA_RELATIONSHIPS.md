# 数据关联与共享架构

## 概述

本文档描述了 AI 预测性冷链合规系统中各页面之间的数据关联和共享机制。所有数据通过统一的查询工具函数访问，确保数据一致性、可维护性和可扩展性。

## 数据表关系图

```
users (用户)
  ├── shipments (运输批次) [1:N]
  │     ├── shipment_devices (设备管理) [1:N]
  │     ├── shipment_tags (标签) [1:N]
  │     ├── shipment_locations (位置追踪) [1:N]
  │     ├── shipment_events (事件日志) [1:N]
  │     ├── shipment_states (状态历史) [1:N]
  │     ├── risk_alerts (风险预警) [1:N]
  │     └── temperature_data (温度数据) [1:N]
  │
  └── risk_alerts (风险预警) [1:N] (通过 shipments 关联)
```

## 核心查询函数

### 1. 批次相关查询

#### `getShipmentsList(params)`
获取批次列表，支持筛选和分页。

**参数：**
- `userId`: 用户 ID
- `status`: 状态筛选 (pending/in_transit/delivered)
- `riskLevel`: 风险等级筛选 (low/medium/high/critical)
- `limit`: 每页数量 (默认 20)
- `offset`: 偏移量
- `includeAlerts`: 是否包含未读预警数量 (默认 true)
- `includeLatestPrediction`: 是否包含最新预测 (默认 true)

**返回数据：**
```typescript
{
  data: Array<{
    // 批次基本信息
    id: number;
    shipment_number: string;
    product: string;
    origin: string;
    destination: string;
    status: string;
    risk_level: string;
    current_temperature: number;
    temperature_requirement: number;
    // 关联数据
    devices: Array<ShipmentDevice>;
    tags: Array<string>;
    unread_alerts_count: number; // 未读预警数量
  }>,
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  }
}
```

#### `getShipmentDetail(shipmentId)`
获取单个批次的完整详情，包含所有关联数据。

**返回数据：**
```typescript
{
  shipment: {
    // 批次所有字段
  },
  devices: Array<ShipmentDevice>,
  tags: Array<string>,
  locations: Array<ShipmentLocation>,
  events: Array<ShipmentEvent>,
  states: Array<ShipmentState>,
  alerts: Array<RiskAlert>,
}
```

#### `getShipmentStats(userId?)`
获取批次统计数据。

**返回数据：**
```typescript
{
  total: number;          // 总批次数
  active: number;         // 运输中
  pending: number;        // 待出发
  delivered: number;      // 已送达
  highRisk: number;       // 高风险
  todayCreated: number;   // 今日创建
}
```

### 2. 预警相关查询

#### `getAlertsList(params)`
获取预警列表，支持筛选和分页。

**参数：**
- `shipmentId`: 批次 ID
- `severity`: 严重程度 (low/medium/high/critical)
- `isRead`: 是否已读
- `isHandled`: 是否已处理
- `limit`: 每页数量 (默认 20)
- `offset`: 偏移量

**返回数据：**
```typescript
{
  data: Array<{
    // 预警基本信息
    id: number;
    shipment_id: number;
    alert_type: string;
    severity: string;
    message: string;
    detail: object;
    is_read: boolean;
    is_handled: boolean;
    handled_at: string;
    handle_action: string;
    alerted_at: string;
    // 关联数据
    shipment: {
      id: number;
      shipment_number: string;
      product_type: string;
      origin: string;
      destination: string;
      status: string;
      current_temperature: number;
      temperature_requirement: number;
    };
  }>,
  pagination: { /* ... */ }
}
```

#### `getAlertDetail(alertId)`
获取单个预警详情，包含批次和预测信息。

**返回数据：**
```typescript
{
  // 预警所有字段
  shipment: { /* 批次信息 */ },
  prediction: { /* 预测信息 */ },
}
```

#### `getUnreadAlertsCount()`
获取未读预警数量。

**返回：** `number`

### 3. 预测相关查询

#### `getShipmentPredictions(shipmentId, limit)`
获取批次历史预测。

### 4. 温度数据查询

#### `getShipmentTemperatureData(shipmentId, limit)`
获取批次温度数据。

### 5. 事件日志查询

#### `getShipmentEvents(shipmentId, params)`
获取批次事件日志。

### 6. 位置追踪查询

#### `getShipmentLocations(shipmentId, limit)`
获取批次位置数据。

### 7. 状态历史查询

#### `getShipmentStates(shipmentId)`
获取批次状态历史。

### 8. 设备信息查询

#### `getShipmentDevices(shipmentId)`
获取批次设备列表。

## API 路由映射

| 路由 | 查询函数 | 页面 |
|------|---------|------|
| `GET /api/stats` | `getShipmentStats`, `getUnreadAlertsCount`, `getAlertsList`, `getShipmentsList` | 主页 |
| `GET /api/shipments` | `getShipmentsList` | 批次列表页 |
| `GET /api/shipments/[id]/detail` | `getShipmentDetail` | 批次详情页 |
| `GET /api/alerts` | `getAlertsList` | 预警列表页 |
| `GET /api/alerts/[id]` | `getAlertDetail` | 预警详情页 |

## 页面数据流向

### 主页
```
GET /api/stats
  ↓
  ├─> getShipmentStats() → 显示批次统计
  ├─> getUnreadAlertsCount() → 显示未读预警数量
  ├─> getAlertsList(limit=5) → 显示最近预警
  └─> getShipmentsList(limit=5) → 显示最近批次
```

### 批次列表页
```
GET /api/shipments?limit=10&offset=0&status=all
  ↓
  getShipmentsList()
  ├─> 显示批次列表
  ├─> 每个批次显示未读预警数量
  └─> 点击批次 → 跳转到批次详情页
```

### 批次详情页
```
GET /api/shipments/[id]/detail
  ↓
  getShipmentDetail(id)
  ├─> 显示批次基本信息
  ├─> 显示设备列表
  ├─> 显示标签
  ├─> 显示预警列表
  ├─> 显示事件日志
  ├─> 显示状态历史
  └─> 显示位置追踪
```

### 预警列表页
```
GET /api/alerts?limit=10&offset=0&severity=all&isRead=all&isHandled=all
  ↓
  getAlertsList()
  ├─> 显示预警列表
  ├─> 每个预警关联批次信息
  └─> 点击批次 → 跳转到批次详情页
```

## 数据共享机制

### 1. 批次-预警关联
- 批次列表显示未读预警数量
- 预警列表关联批次信息
- 预警详情显示批次和预测信息

### 2. 批次-预测关联
- 批次详情页显示预警，预警关联预测结果
- 预测创建时自动生成预警

### 3. 批次-事件关联
- 批次详情页显示事件日志
- 预测结果存储为事件

### 4. 预警-预测关联
- 预警详情显示预测结果
- 预测创建时自动生成预警

## 数据一致性保证

### 1. 统一查询入口
所有数据查询通过 `queries.ts` 中的函数进行，确保查询逻辑一致。

### 2. 级联更新
- 预测创建 → 自动生成预警
- 预警处理 → 更新处理状态和时间
- 批次状态变更 → 记录状态历史

### 3. 外键约束
数据库表通过外键约束保证引用完整性：
- `shipments.user_id → users.id`
- `risk_alerts.shipment_id → shipments.id`
- `shipment_devices.shipment_id → shipments.id`
- `shipment_tags.shipment_id → shipments.id`
- `shipment_events.shipment_id → shipments.id`
- `shipment_states.shipment_id → shipments.id`

## 性能优化

### 1. 并行查询
使用 `Promise.all` 并行获取关联数据，减少查询时间。

### 2. 分页支持
所有列表查询支持分页，避免一次性加载过多数据。

### 3. 选择性加载
通过参数控制是否加载关联数据（如 `includeAlerts`），减少不必要的数据传输。

### 4. 索引优化
数据库表已创建索引，加速查询：
- `shipments(id, user_id, status, risk_level)`
- `risk_alerts(shipment_id, severity, is_read, is_handled, alerted_at)`
- `shipment_events(shipment_id, event_type, timestamp)`

## 扩展性

### 1. 新增查询函数
在 `queries.ts` 中添加新的查询函数，遵循现有命名和结构规范。

### 2. 新增关联表
创建新表并添加外键约束，然后在相关查询函数中添加关联逻辑。

### 3. 新增 API 路由
创建新的 API 路由，使用统一的查询函数。

## 总结

通过统一的数据查询工具函数和清晰的表关系设计，系统实现了：

1. **数据一致性**：所有页面使用相同的数据源和查询逻辑
2. **可维护性**：查询逻辑集中管理，易于修改和优化
3. **可扩展性**：新功能可以轻松集成到现有架构
4. **性能优化**：并行查询、分页、选择性加载等优化措施
5. **完整性保证**：外键约束和级联操作确保数据完整性
