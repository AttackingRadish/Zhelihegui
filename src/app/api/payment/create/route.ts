import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// PayJS配置 - 请替换为你的实际配置
const PAYJS_MCHID = process.env.PAYJS_MCHID || '';
const PAYJS_KEY = process.env.PAYJS_KEY || '';
const PAYJS_API_URL = 'https://payjs.cn/api/native';

// 创建Supabase客户端
const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
};

// 生成PayJS签名
const generatePayJSSign = (params: Record<string, string>, key: string) => {
  const sortedParams = Object.keys(params)
    .filter(k => params[k] !== '' && k !== 'sign')
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  
  return crypto.createHash('md5').update(sortedParams + '&key=' + key).digest('hex').toUpperCase();
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planType, paymentMethod } = body;

    // 验证参数
    if (!userId || !planType) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证套餐类型
    if (!['pro', 'enterprise'].includes(planType)) {
      return NextResponse.json(
        { error: '无效的套餐类型' },
        { status: 400 }
      );
    }

    // 设置金额
    const amount = planType === 'pro' ? 99 : 499;

    const supabase = createSupabaseClient();

    // 生成订单号
    const orderId = `ORDER${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 创建订单记录
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .insert({
        id: orderId,
        user_id: userId,
        plan_type: planType,
        amount: amount,
        payment_method: paymentMethod || 'wechat',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('创建订单失败:', orderError);
      return NextResponse.json(
        { error: '创建订单失败' },
        { status: 500 }
      );
    }

    // 调用PayJS API创建支付
    const payjsParams: Record<string, string> = {
      mchid: PAYJS_MCHID,
      total_fee: (amount * 100).toString(), // 转换为分
      out_trade_no: orderId,
      body: `升级${planType === 'pro' ? '专业版' : '企业版'}`,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/notify`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      attach: JSON.stringify({ userId, planType })
    };

    // 生成签名
    payjsParams.sign = generatePayJSSign(payjsParams, PAYJS_KEY);

    // 调用PayJS API
    const payjsResponse = await fetch(PAYJS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payjsParams)
    });

    const payjsData = await payjsResponse.json();

    if (payjsData.return_code !== 1) {
      // 更新订单状态为失败
      await supabase
        .from('payment_orders')
        .update({ 
          status: 'failed',
          error_msg: payjsData.return_msg 
        })
        .eq('id', orderId);

      return NextResponse.json(
        { error: payjsData.return_msg || '创建支付失败' },
        { status: 500 }
      );
    }

    // 更新订单的PayJS订单号
    await supabase
      .from('payment_orders')
      .update({ 
        payjs_order_id: payjsData.jsapi_order_id,
        payjs_data: payjsData
      })
      .eq('id', orderId);

    return NextResponse.json({
      success: true,
      orderId: orderId,
      payjsOrderId: payjsData.jsapi_order_id,
      qrCode: payjsData.code_url, // 支付二维码链接
      amount: amount
    });

  } catch (error) {
    console.error('创建支付订单错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
