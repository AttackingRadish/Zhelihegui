import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// 虎皮椒配置 - 请替换为你的实际配置
const HUPIAO_APPID = process.env.HUPIAO_APPID || '';
const HUPIAO_KEY = process.env.HUPIAO_KEY || '';
const HUPIAO_API_URL = 'https://api.xunhupay.com/payment/do.html';

// 创建Supabase客户端
const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
};

// 生成随机字符串
const generateNonceStr = () => {
  return Math.random().toString(36).substr(2, 15);
};

// 生成虎皮椒签名
const generateHupiaoSign = (params: {
  appid: string;
  body: string;
  nonce_str: string;
  notify_url: string;
  total_fee: string;
  trade_order_id: string;
}, key: string) => {
  const signStr = `${params.appid}${params.body}${params.nonce_str}${params.notify_url}${params.total_fee}${params.trade_order_id}${key}`;
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
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

    // 验证支付方式
    if (!['wechat', 'alipay'].includes(paymentMethod || 'wechat')) {
      return NextResponse.json(
        { error: '无效的支付方式' },
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

    // 调用虎皮椒API创建支付
    const nonceStr = generateNonceStr();
    const hupiaoParams = {
      appid: HUPIAO_APPID,
      body: `升级${planType === 'pro' ? '专业版' : '企业版'}`,
      nonce_str: nonceStr,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/notify`,
      total_fee: amount.toString(),
      trade_order_id: orderId,
      attach: JSON.stringify({ userId, planType }),
      type: paymentMethod === 'wechat' ? 'WxPay' : 'AliPay'
    };

    // 生成签名
    hupiaoParams.sign = generateHupiaoSign({
      appid: hupiaoParams.appid,
      body: hupiaoParams.body,
      nonce_str: hupiaoParams.nonce_str,
      notify_url: hupiaoParams.notify_url,
      total_fee: hupiaoParams.total_fee,
      trade_order_id: hupiaoParams.trade_order_id
    }, HUPIAO_KEY);

    // 调用虎皮椒API
    const hupiaoResponse = await fetch(HUPIAO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(hupiaoParams)
    });

    const hupiaoData = await hupiaoResponse.json();

    if (hupiaoData.errcode !== 0) {
      // 更新订单状态为失败
      await supabase
        .from('payment_orders')
        .update({ 
          status: 'failed',
          error_msg: hupiaoData.errmsg || '创建支付失败'
        })
        .eq('id', orderId);

      return NextResponse.json(
        { error: hupiaoData.errmsg || '创建支付失败' },
        { status: 500 }
      );
    }

    // 更新订单的虎皮椒订单号
    await supabase
      .from('payment_orders')
      .update({ 
        payjs_order_id: hupiaoData.order_id,
        payjs_data: hupiaoData
      })
      .eq('id', orderId);

    return NextResponse.json({
      success: true,
      orderId: orderId,
      payjsOrderId: hupiaoData.order_id,
      qrCode: hupiaoData.url_qrcode, // 支付二维码链接
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
