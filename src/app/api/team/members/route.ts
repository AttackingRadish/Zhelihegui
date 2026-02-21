import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const teamId = searchParams.get('team_id');

    if (email) {
      const { data, error } = await client
        .from('users')
        .select('id, email, name, company')
        .ilike('email', `%${email}%`)
        .limit(10);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    if (!teamId) {
      return NextResponse.json({ data: [], count: 0 });
    }

    const { data: members, error } = await client
      .from('team_members')
      .select('*, user:user_id(id, email, name)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedMembers = members?.map((m: any) => ({
      id: m.id,
      team_id: m.team_id,
      user_id: m.user?.id,
      email: m.user?.email,
      name: m.user?.name,
      role: m.role,
      created_at: m.created_at
    })) || [];

    return NextResponse.json({ data: formattedMembers, count: formattedMembers.length });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, teamId, role } = body;

    if (!userId || !teamId) {
      return NextResponse.json(
        { error: '缺少必要参数: userId 或 teamId' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    const { data: existing } = await client
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: '该用户已是团队成员' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: role || 'member'
      })
      .select('*, user:user_id(id, email, name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const memberData = data as any;
    const result = {
      id: memberData.id,
      team_id: memberData.team_id,
      user_id: memberData.user?.id,
      email: memberData.user?.email,
      name: memberData.user?.name,
      role: memberData.role,
      created_at: memberData.created_at
    };

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: '缺少必要参数: id' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const { error } = await client
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
