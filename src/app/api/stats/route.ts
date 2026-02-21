import { NextRequest, NextResponse } from 'next/server';
import { getShipmentStats, getUnreadAlertsCount, getAlertsList, getShipmentsList } from '@/storage/database/queries';

// GET /api/stats - 获取系统统计信息
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    // 并行获取所有统计数据
    const [shipmentStats, unreadAlertsCount, recentAlerts, recentShipments] = await Promise.all([
      getShipmentStats(userId),
      getUnreadAlertsCount(),
      getAlertsList({ limit: 5 }),
      getShipmentsList({ limit: 5, includeAlerts: true }),
    ]);

    // 计算平均温度
    const avgTemperature = recentShipments.data.reduce((sum, shipment) => {
      return sum + (shipment.current_temperature || 0);
    }, 0) / (recentShipments.data.length || 1);

    return NextResponse.json({
      success: true,
      data: {
        shipments: shipmentStats,
        alerts: {
          total: unreadAlertsCount,
          unread: unreadAlertsCount,
        },
        recentAlerts: recentAlerts.data,
        recentShipments: recentShipments.data,
        avgTemperature: avgTemperature.toFixed(1),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
