import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = getSupabaseClient();

    let query = supabase
      .from('shipments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 状态筛选
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 搜索筛选
    if (search) {
      query = query.or(`shipment_number.ilike.%${search}%,product_type.ilike.%${search}%,origin.ilike.%${search}%,destination.ilike.%${search}%`);
    }

    // 分页
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: shipments, error, count } = await query;

    if (error) {
      console.error('获取批次列表失败:', error);
      return NextResponse.json(
        { error: '获取批次列表失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: shipments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
