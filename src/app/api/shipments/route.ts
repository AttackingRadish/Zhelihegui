import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getShipmentsList, getShipmentStats } from '@/storage/database/queries';

// GET /api/shipments - 获取运输批次列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const riskLevel = searchParams.get('risk_level');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeAlerts = searchParams.get('includeAlerts') !== 'false';

    const result = await getShipmentsList({
      userId,
      status,
      riskLevel,
      limit,
      offset,
      includeAlerts,
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

// GET /api/shipments/stats - 获取批次统计
export async function GET_STATS(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    const stats = await getShipmentStats(userId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/shipments - 创建新的运输批次
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      product,
      quantity,
      origin,
      destination,
      departureTime,
      estimatedArrivalTime,
      route,
      packaging,
      temperatureRequirement,
    } = body;

    if (!userId || !product || !quantity || !origin || !destination || !departureTime || !estimatedArrivalTime || !route || !packaging || !temperatureRequirement) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const shipmentNumber = `SHP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const { data, error } = await client
      .from('shipments')
      .insert({
        user_id: userId,
        shipment_number: shipmentNumber,
        product,
        quantity,
        origin,
        destination,
        departure_time: departureTime,
        estimated_arrival_time: estimatedArrivalTime,
        route,
        packaging,
        temperature_requirement: temperatureRequirement,
        status: 'pending',
        risk_level: 'low',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 创建初始状态记录
    await client.from('shipment_states').insert({
      shipment_id: data.id,
      status: 'pending',
      state_data: {
        created: true,
        initialized: true,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
