import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/users - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');

    let query = client.from('users').select('*');

    if (status) {
      query = query.eq('status', status);
    }
    if (plan) {
      query = query.eq('plan', plan);
    }
    
    // 添加对 email 查询参数的支持
    const email = searchParams.get('email');
    if (email) {
      query = query.eq('email', email);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

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

// POST /api/users - 创建新用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, company, phone, plan } = body;

    if (!email || !name || !company) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, company' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .insert({
        email,
        name,
        company,
        phone: phone || null,
        plan: plan || 'basic',
        status: 'active',
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
