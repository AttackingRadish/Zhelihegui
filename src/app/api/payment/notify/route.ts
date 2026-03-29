import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// 虎皮椒配置
const HUPIAO_KEY = process.env.HUPIAO_KEY || '';

// 创建Supabase客户端
const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
};

// 验证虎皮椒签名
const verifyHupiaoSign = (params: {
  appid: string;
  body: string;
  nonce_str: string;
  notify_url: string;
  total_fee: string;
  trade_order_id: string;
  sign: string;
}, key: string) => {
  const signStr = `${params.appid}${params.body}${params.nonce_str}${params.notify_url}${params.total_fee}${params.trade_order_id}${key}`;
  const calculatedSign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  return params.sign === calculatedSign;
};

export async function POST(request: NextRequest) {
  try {
    // 获取回调数据
    const body = await request.json();
    
    console.log('收到支付回调:', body);

    // 验证签名
    if (!verifyHupiaoSign({
      appid: body.appid,
      body: body.body,
      nonce_str: body.nonce_str,
      notify_url: body.notify_url,
      total_fee: body.total_fee,
      trade_order_id: body.trade_order_id,
      sign: body.sign
    }, HUPIAO_KEY)) {
      console.error('签名验证失败');
      return NextResponse.json({ errcode: 1, errmsg: '签名验证失败' });
    }

    const {
      trade_order_id, // 我们的订单号
      transaction_id, // 虎皮椒订单号
      total_fee,
      attach,
      time_end
    } = body;

    const supabase = createSupabaseClient();

    // 查询订单
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('id', trade_order_id)
      .single();

    if (orderError || !order) {
      console.error('订单不存在:', trade_order_id);
      return NextResponse.json({ errcode: 1, errmsg: '订单不存在' });
    }

    // 检查订单是否已处理
    if (order.status === 'paid') {
      return NextResponse.json({ errcode: 0, errmsg: 'OK' });
    }

    // 验证金额（虎皮椒返回的是元，不是分）
    if (parseFloat(total_fee) !== order.amount) {
      console.error('金额不匹配:', total_fee, order.amount);
      return NextResponse.json({ errcode: 1, errmsg: '金额不匹配' });
    }

    // 解析attach获取用户信息
    let attachData;
    try {
      attachData = JSON.parse(attach || '{}');
    } catch {
      attachData = {};
    }

    // 开始事务处理
    // 1. 更新订单状态
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        payjs_order_id: transaction_id,
        wechat_order_id: body.transaction_id,
        paid_at: new Date().toISOString(),
        notify_data: body
      })
      .eq('id', trade_order_id);

    if (updateError) {
      console.error('更新订单状态失败:', updateError);
      return NextResponse.json({ errcode: 1, errmsg: '更新订单失败' });
    }

    // 2. 创建账单记录
    const { error: billingError } = await supabase
      .from('billing_records')
      .insert({
        user_id: order.user_id,
        plan_type: order.plan_type,
        amount: order.amount,
        payment_method: order.payment_method || 'wechat',
        payjs_order_id: transaction_id,
        status: 'completed',
        payment_date: new Date().toISOString()
      });

    if (billingError) {
      console.error('创建账单记录失败:', billingError);
    }

    // 3. 升级用户会员
    const membershipDays = order.plan_type === 'pro' ? 30 : 365;
    const membershipExpiresAt = new Date();
    membershipExpiresAt.setDate(membershipExpiresAt.getDate() + membershipDays);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        current_plan: order.plan_type,
        membership_expires_at: membershipExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', order.user_id);

    if (profileError) {
      console.error('升级会员失败:', profileError);
      return NextResponse.json({ errcode: 1, errmsg: '升级会员失败' });
    }

    console.log('支付处理成功:', trade_order_id);

    // 返回成功响应给虎皮椒
    return NextResponse.json({ errcode: 0, errmsg: 'OK' });

  } catch (error) {
    console.error('处理支付回调错误:', error);
    return NextResponse.json({ errcode: 1, errmsg: '服务器错误' });
  }
}
