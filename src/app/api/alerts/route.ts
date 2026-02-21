import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getAlertsList, getUnreadAlertsCount } from '@/storage/database/queries';

// GET /api/alerts - 获取预警列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shipmentId = searchParams.get('shipment_id');
    const severity = searchParams.get('severity');
    const isRead = searchParams.get('isRead');
    const isHandled = searchParams.get('isHandled');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getAlertsList({
      shipmentId: shipmentId || undefined,
      severity: severity || undefined,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      isHandled: isHandled === 'true' ? true : isHandled === 'false' ? false : undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/alerts/unread-count - 获取未读预警数量
export async function GET_UNREAD_COUNT() {
  try {
    const count = await getUnreadAlertsCount();

    return NextResponse.json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/alerts - 创建新的风险预警
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shipmentId,
      alertType,
      severity,
      message,
      detail,
    } = body;

    if (!shipmentId || !alertType || !severity || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('risk_alerts')
      .insert({
        shipment_id: shipmentId,
        alert_type: alertType,
        severity,
        message,
        detail: detail || {},
        is_read: false,
        is_handled: false,
        alerted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
