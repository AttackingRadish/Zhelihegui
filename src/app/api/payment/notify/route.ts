import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// PayJS配置
const PAYJS_KEY = process.env.PAYJS_KEY || '';

// 创建Supabase客户端
const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
};

// 验证PayJS签名
const verifyPayJSSign = (params: Record<string, string>, key: string) => {
  const sign = params.sign;
  const sortedParams = Object.keys(params)
    .filter(k => params[k] !== '' && k !== 'sign')
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  
  const calculatedSign = crypto.createHash('md5')
    .update(sortedParams + '&key=' + key)
    .digest('hex')
    .toUpperCase();
  
  return sign === calculatedSign;
};

export async function POST(request: NextRequest) {
  try {
    // 获取回调数据
    const body = await request.json();
    
    console.log('收到支付回调:', body);

    // 验证签名
    if (!verifyPayJSSign(body, PAYJS_KEY)) {
      console.error('签名验证失败');
      return NextResponse.json({ return_code: 0, return_msg: '签名验证失败' });
    }

    const {
      out_trade_no, // 我们的订单号
      payjs_order_id, // PayJS订单号
      transaction_id, // 微信支付订单号
      total_fee,
      time_end,
      openid,
      attach
    } = body;

    const supabase = createSupabaseClient();

    // 查询订单
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('id', out_trade_no)
      .single();

    if (orderError || !order) {
      console.error('订单不存在:', out_trade_no);
      return NextResponse.json({ return_code: 0, return_msg: '订单不存在' });
    }

    // 检查订单是否已处理
    if (order.status === 'paid') {
      return NextResponse.json({ return_code: 1, return_msg: 'OK' });
    }

    // 验证金额
    if (parseInt(total_fee) !== Math.round(order.amount * 100)) {
      console.error('金额不匹配:', total_fee, order.amount * 100);
      return NextResponse.json({ return_code: 0, return_msg: '金额不匹配' });
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
        payjs_order_id: payjs_order_id,
        wechat_order_id: transaction_id,
        paid_at: new Date().toISOString(),
        notify_data: body,
        openid: openid
      })
      .eq('id', out_trade_no);

    if (updateError) {
      console.error('更新订单状态失败:', updateError);
      return NextResponse.json({ return_code: 0, return_msg: '更新订单失败' });
    }

    // 2. 创建账单记录
    const { error: billingError } = await supabase
      .from('billing_records')
      .insert({
        user_id: order.user_id,
        plan_type: order.plan_type,
        amount: order.amount,
        payment_method: order.payment_method || 'wechat',
        payjs_order_id: payjs_order_id,
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
      return NextResponse.json({ return_code: 0, return_msg: '升级会员失败' });
    }

    console.log('支付处理成功:', out_trade_no);

    // 返回成功响应给PayJS
    return NextResponse.json({ return_code: 1, return_msg: 'OK' });

  } catch (error) {
    console.error('处理支付回调错误:', error);
    return NextResponse.json({ return_code: 0, return_msg: '服务器错误' });
  }
}
