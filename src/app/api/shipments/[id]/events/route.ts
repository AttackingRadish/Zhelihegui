import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/shipments/:id/events - 获取批次事件日志
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const eventType = searchParams.get('event_type');

    let query = client
      .from('shipment_events')
      .select('*')
      .eq('shipment_id', id);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query
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

// POST /api/shipments/:id/events - 添加批次事件
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { eventType, eventTitle, description, eventData, triggeredBy } = body;

    if (!eventType || !eventTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, eventTitle' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('shipment_events')
      .insert({
        shipment_id: id,
        event_type: eventType,
        event_title: eventTitle,
        description: description || null,
        event_data: eventData || null,
        triggered_by: triggeredBy || null,
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
