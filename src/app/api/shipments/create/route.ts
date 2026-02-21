import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      shipmentNumber,
      productType,
      quantity,
      origin,
      destination,
      departureTime,
      estimatedArrivalTime,
      temperatureRequirement,
      packaging,
      customerId,
      tags,
      deviceId,
    } = body;

    // 验证必填字段
    if (!shipmentNumber || !productType || !origin || !destination || !departureTime || !temperatureRequirement) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 创建批次
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        shipment_number: shipmentNumber,
        product_type: productType,
        quantity: quantity || 0,
        origin,
        destination,
        departure_time: new Date(departureTime).toISOString(),
        estimated_arrival_time: estimatedArrivalTime ? new Date(estimatedArrivalTime).toISOString() : null,
        temperature_requirement: parseFloat(temperatureRequirement),
        packaging: packaging || '标准包装',
        customer_id: customerId || null,
        status: 'pending',
        risk_level: 'low',
        current_temperature: null,
        current_humidity: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (shipmentError) {
      console.error('创建批次失败:', shipmentError);
      return NextResponse.json(
        { error: '创建批次失败: ' + shipmentError.message },
        { status: 500 }
      );
    }

    // 创建初始状态历史
    await supabase
      .from('shipment_status_history')
      .insert({
        shipment_id: shipment.id,
        to_status: 'pending',
        timestamp: new Date().toISOString(),
        notes: '批次创建',
      });

    // 如果有标签，创建标签
    if (tags && tags.length > 0) {
      const tagInserts = tags.map((tag: string) => ({
        shipment_id: shipment.id,
        tag_name: tag,
        created_at: new Date().toISOString(),
      }));

      await supabase.from('shipment_tags').insert(tagInserts);
    }

    // 如果有设备，绑定设备
    if (deviceId) {
      await supabase.from('shipment_devices').insert({
        shipment_id: shipment.id,
        device_id: deviceId,
        device_type: 'temperature_sensor',
        device_name: deviceId,
        status: 'active',
        assigned_at: new Date().toISOString(),
        is_active: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: shipment,
      message: '批次创建成功',
    });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
