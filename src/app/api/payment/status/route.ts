import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 创建Supabase客户端
const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        { error: '缺少订单号' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // 查询订单状态
    const { data: order, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
      planType: order.plan_type,
      amount: order.amount,
      paidAt: order.paid_at,
      createdAt: order.created_at
    });

  } catch (error) {
    console.error('查询订单状态错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
