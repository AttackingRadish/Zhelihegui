import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/shipments/:id/devices - 获取批次设备
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = client
      .from('shipment_devices')
      .select('*')
      .eq('shipment_id', id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('assigned_at', { ascending: false });

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

// POST /api/shipments/:id/devices - 绑定批次设备
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { deviceId, deviceType, deviceName, metadata } = body;

    if (!deviceId || !deviceType) {
      return NextResponse.json(
        { error: 'Missing required fields: deviceId, deviceType' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('shipment_devices')
      .insert({
        shipment_id: id,
        device_id: deviceId,
        device_type: deviceType,
        device_name: deviceName || null,
        status: 'active',
        metadata: metadata || null,
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
