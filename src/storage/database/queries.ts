import { getSupabaseClient } from './supabase-client';

/**
 * 批次相关查询
 */

/**
 * 获取批次列表（带关联数据）
 */
export async function getShipmentsList(params: {
  userId?: string;
  status?: string;
  riskLevel?: string;
  limit?: number;
  offset?: number;
  includeAlerts?: boolean;
  includeLatestPrediction?: boolean;
}) {
  const client = getSupabaseClient();
  const {
    userId,
    status,
    riskLevel,
    limit = 20,
    offset = 0,
    includeAlerts = true,
    includeLatestPrediction = true,
  } = params;

  let query = client
    .from('shipments')
    .select('*', { count: 'exact' });

  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (riskLevel) {
    query = query.eq('risk_level', riskLevel);
  }

  query = query
    .order('departure_time', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  // 如果需要包含设备、标签和未读预警数量
  const shipmentsWithDetails = data && data.length > 0
    ? await Promise.all(
        data.map(async (shipment) => {
          // 获取设备信息
          const { data: devices } = await client
            .from('shipment_devices')
            .select('id, device_id, device_type, status')
            .eq('shipment_id', shipment.id);

          // 获取标签
          const { data: tags } = await client
            .from('shipment_tags')
            .select('tag_name')
            .eq('shipment_id', shipment.id);

          // 如果需要包含未读预警数量
          let unreadAlertsCount = 0;
          if (includeAlerts) {
            const { data: alerts } = await client
              .from('risk_alerts')
              .select('id')
              .eq('shipment_id', shipment.id)
              .eq('is_read', false);

            unreadAlertsCount = alerts?.length || 0;
          }

          return {
            ...shipment,
            devices: devices || [],
            tags: tags?.map(t => t.tag_name) || [],
            unread_alerts_count: unreadAlertsCount,
          };
        })
      )
    : [];

  return {
    data: shipmentsWithDetails,
    count: count || 0,
    pagination: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * 获取单个批次详情（带所有关联数据）
 */
export async function getShipmentDetail(shipmentId: string | number) {
  const client = getSupabaseClient();

  // 获取批次基本信息
  const { data: shipment, error: shipmentError } = await client
    .from('shipments')
    .select('*')
    .eq('id', shipmentId)
    .single();

  if (shipmentError) {
    throw shipmentError;
  }

  // 并行获取所有关联数据
  const [
    { data: devices },
    { data: tags },
    { data: locations },
    { data: events },
    { data: states },
    { data: alerts },
  ] = await Promise.all([
    client.from('shipment_devices').select('*').eq('shipment_id', shipmentId),
    client.from('shipment_tags').select('tag_name').eq('shipment_id', shipmentId),
    client.from('shipment_locations').select('*').eq('shipment_id', shipmentId).order('timestamp', { ascending: false }).limit(10),
    client.from('shipment_events').select('*').eq('shipment_id', shipmentId).order('timestamp', { ascending: false }).limit(10),
    client.from('shipment_states').select('*').eq('shipment_id', shipmentId).order('timestamp', { ascending: false }),
    client.from('risk_alerts').select('*').eq('shipment_id', shipmentId).order('alerted_at', { ascending: false }),
  ]);

  return {
    shipment,
    devices: devices || [],
    tags: tags?.map(t => t.tag_name) || [],
    locations: locations || [],
    events: events || [],
    states: states || [],
    alerts: alerts || [],
  };
}

/**
 * 获取批次统计数据
 */
export async function getShipmentStats(userId?: string) {
  const client = getSupabaseClient();

  let baseQuery = client.from('shipments').select('id, status, risk_level, created_at');
  if (userId) {
    baseQuery = baseQuery.eq('user_id', userId);
  }

  const { data: allShipments, error } = await baseQuery;

  if (error) {
    throw error;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const stats = {
    total: allShipments?.length || 0,
    active: allShipments?.filter(s => s.status === 'in_transit').length || 0,
    pending: allShipments?.filter(s => s.status === 'pending').length || 0,
    delivered: allShipments?.filter(s => s.status === 'delivered').length || 0,
    highRisk: allShipments?.filter(s => s.risk_level === 'high' || s.risk_level === 'critical').length || 0,
    todayCreated: allShipments?.filter(s => new Date(s.created_at) >= today).length || 0,
  };

  return stats;
}

/**
 * 预警相关查询
 */

/**
 * 获取预警列表（带批次信息）
 */
export async function getAlertsList(params: {
  shipmentId?: string | number;
  severity?: string;
  isRead?: boolean;
  isHandled?: boolean;
  limit?: number;
  offset?: number;
}) {
  const client = getSupabaseClient();
  const {
    shipmentId,
    severity,
    isRead,
    isHandled,
    limit = 20,
    offset = 0,
  } = params;

  let query = client
    .from('risk_alerts')
    .select('*', { count: 'exact' });

  if (shipmentId) {
    query = query.eq('shipment_id', shipmentId);
  }
  if (severity) {
    query = query.eq('severity', severity);
  }
  if (isRead !== undefined) {
    query = query.eq('is_read', isRead);
  }
  if (isHandled !== undefined) {
    query = query.eq('is_handled', isHandled);
  }

  query = query
    .order('alerted_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  // 手动关联批次信息
  const alertsWithShipments = data && data.length > 0
    ? await Promise.all(
        data.map(async (alert) => {
          const { data: shipment } = await client
            .from('shipments')
            .select('id, shipment_number, product_type, origin, destination, status, current_temperature, temperature_requirement')
            .eq('id', alert.shipment_id)
            .single();

          return {
            ...alert,
            shipment,
          };
        })
      )
    : [];

  return {
    data: alertsWithShipments,
    count: count || 0,
    pagination: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * 获取单个预警详情（带批次和预测信息）
 */
export async function getAlertDetail(alertId: string | number) {
  const client = getSupabaseClient();

  const { data: alert, error } = await client
    .from('risk_alerts')
    .select('*')
    .eq('id', alertId)
    .single();

  if (error) {
    throw error;
  }

  // 手动获取批次信息
  const { data: shipment } = await client
    .from('shipments')
    .select('id, shipment_number, product_type, origin, destination, status, current_temperature, temperature_requirement')
    .eq('id', alert.shipment_id)
    .single();

  // 手动获取预测信息
  const { data: prediction } = await client
    .from('shipment_events')
    .select('*')
    .eq('shipment_id', alert.shipment_id)
    .eq('event_type', 'prediction')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  return {
    ...alert,
    shipment,
    prediction,
  };
}

/**
 * 获取未读预警统计
 */
export async function getUnreadAlertsCount() {
  const client = getSupabaseClient();

  const { count, error } = await client
    .from('risk_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) {
    throw error;
  }

  return count || 0;
}

/**
 * 预测相关查询
 */

/**
 * 获取批次历史预测
 */
export async function getShipmentPredictions(shipmentId: string | number, limit: number = 5) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('shipment_events')
    .select('*')
    .eq('shipment_id', shipmentId)
    .eq('event_type', 'prediction')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * 温度数据查询
 */

/**
 * 获取批次温度数据
 */
export async function getShipmentTemperatureData(
  shipmentId: string | number,
  limit: number = 100
) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('shipment_events')
    .select('event_data, timestamp')
    .eq('shipment_id', shipmentId)
    .eq('event_type', 'temperature')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data?.map(d => ({
    ...d.event_data,
    timestamp: d.timestamp,
  })) || [];
}

/**
 * 事件日志查询
 */

/**
 * 获取批次事件日志
 */
export async function getShipmentEvents(
  shipmentId: string | number,
  params: {
    eventType?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const client = getSupabaseClient();
  const { eventType, severity, limit = 20, offset = 0 } = params;

  let query = client
    .from('shipment_events')
    .select('*', { count: 'exact' })
    .eq('shipment_id', shipmentId);

  if (eventType) {
    query = query.eq('event_type', eventType);
  }
  if (severity) {
    query = query.eq('severity', severity);
  }

  query = query
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data: data || [],
    count: count || 0,
    pagination: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * 位置追踪查询
 */

/**
 * 获取批次位置数据
 */
export async function getShipmentLocations(
  shipmentId: string | number,
  limit: number = 10
) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('shipment_locations')
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * 状态历史查询
 */

/**
 * 获取批次状态历史
 */
export async function getShipmentStates(
  shipmentId: string | number
) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('shipment_states')
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('timestamp', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * 设备信息查询
 */

/**
 * 获取批次设备列表
 */
export async function getShipmentDevices(
  shipmentId: string | number
) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('shipment_devices')
    .select('*')
    .eq('shipment_id', shipmentId);

  if (error) {
    throw error;
  }

  return data || [];
}
