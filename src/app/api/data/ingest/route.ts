import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipmentId, deviceId, temperature, humidity, location, notes } = body;

    if (!shipmentId || temperature === undefined) {
      return NextResponse.json(
        { error: '缺少必填字段：shipmentId 和 temperature' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 1. 记录温度事件
    await supabase
      .from('shipment_events')
      .insert({
        shipment_id: shipmentId,
        event_type: 'temperature_reading',
        severity: 'low',
        event_title: '温度读数',
        description: `温度读数: ${temperature}°C${humidity ? `, 湿度: ${humidity}%` : ''}`,
        event_data: {
          temperature: parseFloat(temperature),
          humidity: humidity ? parseFloat(humidity) : null,
          device_id: deviceId || null,
          location: location || null,
        },
        timestamp: new Date().toISOString(),
      });

    // 2. 如果有位置信息，记录位置
    if (location && (location.latitude !== undefined || location.lng !== undefined)) {
      await supabase
        .from('shipment_locations')
        .insert({
          shipment_id: shipmentId,
          latitude: location.latitude || location.lat,
          longitude: location.longitude || location.lng,
          address: location.address || null,
          timestamp: new Date().toISOString(),
        });
    }

    // 3. 更新批次当前状态
    await supabase
      .from('shipments')
      .update({
        current_temperature: parseFloat(temperature),
        current_humidity: humidity ? parseFloat(humidity) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipmentId);

    // 4. 检查温度是否异常，触发预警
    const { data: shipment } = await supabase
      .from('shipments')
      .select('temperature_requirement')
      .eq('id', shipmentId)
      .single();

    if (shipment) {
      const tempDiff = Math.abs(parseFloat(temperature) - shipment.temperature_requirement);
      const severity = tempDiff > 5 ? 'critical' : tempDiff > 2 ? 'high' : tempDiff > 1 ? 'medium' : 'low';

      if (severity !== 'low') {
        await supabase
          .from('shipment_events')
          .insert({
            shipment_id: shipmentId,
            event_type: 'temperature_alert',
            severity,
            event_title: '温度异常警告',
            description: `温度异常警告: 当前温度 ${temperature}°C，偏离要求温度 ${shipment.temperature_requirement}°C 达 ${tempDiff.toFixed(1)}°C`,
            event_data: {
              temperature: parseFloat(temperature),
              required_temperature: shipment.temperature_requirement,
              deviation: tempDiff,
            },
            timestamp: new Date().toISOString(),
          });

        // 更新风险等级
        const riskLevel = tempDiff > 5 ? 'critical' : tempDiff > 2 ? 'high' : 'medium';
        await supabase
          .from('shipments')
          .update({ risk_level: riskLevel })
          .eq('id', shipmentId);
      }
    }

    return NextResponse.json({
      success: true,
      message: '数据采集成功',
    });
  } catch (error) {
    console.error('数据采集失败:', error);
    return NextResponse.json(
      { error: '数据采集失败' },
      { status: 500 }
    );
  }
}

// GET 方法用于批量模拟数据采集（用于测试）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shipmentId = searchParams.get('shipmentId');
    const count = parseInt(searchParams.get('count') || '10');

    if (!shipmentId) {
      return NextResponse.json(
        { error: '缺少 shipmentId 参数' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 获取批次信息
    const { data: shipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (!shipment) {
      return NextResponse.json(
        { error: '批次不存在' },
        { status: 404 }
      );
    }

    // 批量生成模拟数据
    const baseTemp = shipment.temperature_requirement;
    const results = [];

    for (let i = 0; i < count; i++) {
      // 生成波动的温度数据（模拟真实情况）
      const variation = (Math.random() - 0.5) * 4; // -2 到 +2 的波动
      const temperature = baseTemp + variation;
      const humidity = 80 + Math.random() * 10; // 80-90% 湿度

      const eventTime = new Date(Date.now() - (count - i) * 30 * 60 * 1000); // 每 30 分钟一条

      await supabase
        .from('shipment_events')
        .insert({
          shipment_id: shipmentId,
          event_type: 'temperature_reading',
          severity: Math.abs(variation) > 2 ? 'high' : 'low',
          event_title: '温度读数',
          description: `温度读数: ${temperature.toFixed(1)}°C, 湿度: ${humidity.toFixed(1)}%`,
          event_data: {
            temperature: parseFloat(temperature.toFixed(2)),
            humidity: parseFloat(humidity.toFixed(2)),
            device_id: `DEVICE-${Math.floor(Math.random() * 1000)}`,
          },
          timestamp: eventTime.toISOString(),
        });

      results.push({
        time: eventTime.toISOString(),
        temperature: temperature.toFixed(1),
        humidity: humidity.toFixed(1),
      });
    }

    // 更新批次当前状态
    await supabase
      .from('shipments')
      .update({
        current_temperature: parseFloat(results[results.length - 1].temperature),
        current_humidity: parseFloat(results[results.length - 1].humidity),
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipmentId);

    return NextResponse.json({
      success: true,
      message: `成功生成 ${count} 条模拟数据`,
      data: results,
    });
  } catch (error) {
    console.error('批量数据生成失败:', error);
    return NextResponse.json(
      { error: '批量数据生成失败' },
      { status: 500 }
    );
  }
}
