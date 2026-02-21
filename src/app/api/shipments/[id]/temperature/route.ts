import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/shipments/:id/temperature - 获取运输批次的温度记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');

    const { data, error } = await client
      .from('temperature_records')
      .select('*')
      .eq('shipment_id', id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count: data?.length });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/shipments/:id/temperature - 记录温度数据
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      temperature,
      humidity,
      location,
      weatherCondition,
      trafficCondition,
      deviceId,
    } = body;

    if (!temperature) {
      return NextResponse.json(
        { error: 'Missing required field: temperature' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('temperature_records')
      .insert({
        shipment_id: id,
        temperature,
        humidity: humidity || null,
        location: location || null,
        weather_condition: weatherCondition || null,
        traffic_condition: trafficCondition || null,
        device_id: deviceId || null,
        is_anomaly: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
