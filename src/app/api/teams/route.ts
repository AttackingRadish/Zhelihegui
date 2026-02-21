import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    
    const client = getSupabaseClient();
    
    if (userId) {
      const { data, error } = await client
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const teamIds = data.map((m: any) => m.team_id);
        const { data: teams, error: teamsError } = await client
          .from('teams')
          .select('*, team_members:team_members(count)')
          .in('id', teamIds);
        
        if (teamsError) throw teamsError;
        return NextResponse.json({ data: teams });
      }
      
      return NextResponse.json({ data: [] });
    }
    
    const { data, error } = await client.from('teams').select('*');
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('获取团队列表失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, created_by } = body;
    
    if (!name || !created_by) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    const { data: team, error } = await client
      .from('teams')
      .insert({ name, created_by })
      .select()
      .single();
    
    if (error) throw error;
    
    const { error: memberError } = await client
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: created_by,
        role: 'admin'
      });
    
    if (memberError) throw memberError;
    
    return NextResponse.json({ data: team });
  } catch (error: any) {
    console.error('创建团队失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ error: '缺少团队ID' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    const { error } = await client.from('teams').delete().eq('id', id);
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('删除团队失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
