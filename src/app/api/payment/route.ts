import { NextRequest, NextResponse } from 'next/server';

// 存储验证码（实际项目中应该使用 Redis 或数据库）
const verificationCodes = new Map<string, { code: string; amount: number; planType: string; createdAt: number }>();

// 生成随机验证码
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 生成支付订单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planType, amount } = body;

    if (!userId || !planType || !amount) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 生成6位数字验证码
    const code = generateCode();
    const orderId = `ORDER_${Date.now()}_${userId}`;

    // 存储验证码信息（10分钟有效）
    verificationCodes.set(orderId, {
      code,
      amount,
      planType,
      createdAt: Date.now(),
    });

    // 清理过期验证码
    const now = Date.now();
    for (const [key, value] of verificationCodes.entries()) {
      if (now - value.createdAt > 10 * 60 * 1000) {
        verificationCodes.delete(key);
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      code,
      message: '支付订单创建成功',
    });
  } catch (error) {
    console.error('创建支付订单失败:', error);
    return NextResponse.json(
      { error: '创建支付订单失败' },
      { status: 500 }
    );
  }
}

// 验证支付验证码
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, code } = body;

    if (!orderId || !code) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const orderInfo = verificationCodes.get(orderId);

    if (!orderInfo) {
      return NextResponse.json(
        { error: '订单不存在或已过期' },
        { status: 400 }
      );
    }

    // 检查是否过期（10分钟）
    if (Date.now() - orderInfo.createdAt > 10 * 60 * 1000) {
      verificationCodes.delete(orderId);
      return NextResponse.json(
        { error: '验证码已过期' },
        { status: 400 }
      );
    }

    // 验证验证码
    if (orderInfo.code !== code) {
      return NextResponse.json(
        { error: '验证码错误' },
        { status: 400 }
      );
    }

    // 验证成功，删除验证码
    verificationCodes.delete(orderId);

    return NextResponse.json({
      success: true,
      message: '支付验证成功',
      planType: orderInfo.planType,
      amount: orderInfo.amount,
    });
  } catch (error) {
    console.error('验证支付失败:', error);
    return NextResponse.json(
      { error: '验证支付失败' },
      { status: 500 }
    );
  }
}
