import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface TemperatureData {
  timestamp: string;
  temperature: number;
  humidity: number;
  location?: string;
}

interface PredictionResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  confidence: number;
  predictions: {
    timeframe: string;
    expectedTempRange: [number, number];
    probability: number;
    factors: string[];
  }[];
  recommendations: string[];
  analysis: string;
  ruleBasedScore?: number;
  llmScore?: number;
}

// 基于规则的预分析
function ruleBasedAnalysis(shipment: any, temperatureData: TemperatureData[]): {
  score: number;
  factors: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
} {
  let score = 0;
  const factors: string[] = [];

  // 1. 检查当前温度偏差
  if (shipment.current_temperature !== null) {
    const tempDiff = Math.abs(shipment.current_temperature - shipment.temperature_requirement);
    if (tempDiff > 5) {
      score += 40;
      factors.push(`当前温度偏差较大 (${tempDiff.toFixed(1)}°C)`);
    } else if (tempDiff > 2) {
      score += 25;
      factors.push(`当前温度超出范围 (${tempDiff.toFixed(1)}°C)`);
    } else if (tempDiff > 1) {
      score += 10;
      factors.push(`当前温度接近边界`);
    }
  }

  // 2. 检查历史温度波动
  if (temperatureData.length >= 5) {
    const temps = temperatureData.slice(-10).map(d => d.temperature);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const variance = temps.reduce((a, b) => a + Math.pow(b - avgTemp, 2), 0) / temps.length;
    const stdDev = Math.sqrt(variance);

    const fluctuation = maxTemp - minTemp;
    if (fluctuation > 5) {
      score += 30;
      factors.push(`历史温度波动较大 (${fluctuation.toFixed(1)}°C)`);
    } else if (fluctuation > 3) {
      score += 15;
      factors.push(`历史温度有波动 (${fluctuation.toFixed(1)}°C)`);
    }

    if (stdDev > 2) {
      score += 20;
      factors.push(`温度不稳定 (标准差: ${stdDev.toFixed(2)})`);
    }
  }

  // 3. 检查运输距离（根据路线判断）
  if (shipment.route && typeof shipment.route === 'object') {
    const distance = shipment.route.distance || 0;
    if (distance > 1000) {
      score += 10;
      factors.push('长距离运输');
    }
  }

  // 4. 检查包装类型
  const packagingRisk: Record<string, number> = {
    '冷藏集装箱': 10,
    '保温箱': 20,
    '干冰包装': 25,
    '液氮容器': 15,
    '标准包装': 30,
  };
  const risk = packagingRisk[shipment.packaging] || 15;
  score += risk;
  factors.push(`包装类型: ${shipment.packaging}`);

  // 5. 检查运输状态
  if (shipment.status === 'in_transit') {
    score += 5;
    factors.push('运输中，风险持续存在');
  }

  // 6. 检查时间因素
  if (shipment.departure_time) {
    const departureTime = new Date(shipment.departure_time);
    const now = new Date();
    const hoursInTransit = (now.getTime() - departureTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursInTransit > 24) {
      score += 15;
      factors.push('已运输超过 24 小时');
    } else if (hoursInTransit > 12) {
      score += 8;
      factors.push('运输时间较长');
    }
  }

  // 限制分数在 0-100 之间
  score = Math.min(100, Math.max(0, score));

  // 确定风险等级
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (score >= 90) {
    riskLevel = 'critical';
  } else if (score >= 70) {
    riskLevel = 'high';
  } else if (score >= 50) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  return { score, factors, riskLevel };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipmentId, mode = 'hybrid' } = body;

    if (!shipmentId) {
      return NextResponse.json(
        { error: '缺少批次 ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 获取批次信息
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { error: '批次不存在' },
        { status: 404 }
      );
    }

    // 获取历史温度数据
    const { data: events } = await supabase
      .from('shipment_events')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('timestamp', { ascending: true });

    // 获取位置数据
    const { data: locations } = await supabase
      .from('shipment_locations')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('timestamp', { ascending: true });

    // 获取同类型产品的历史数据
    const { data: similarShipments } = await supabase
      .from('shipments')
      .select('*')
      .eq('product_type', shipment.product_type)
      .neq('id', shipmentId)
      .order('created_at', { ascending: false })
      .limit(10);

    // 构建温度数据序列
    const temperatureData: TemperatureData[] = events
      ?.filter((e: any) => e.event_type === 'temperature_reading' && e.event_data?.temperature !== undefined)
      .map((e: any) => ({
        timestamp: e.timestamp,
        temperature: e.event_data.temperature,
        humidity: e.event_data.humidity || 0,
        location: e.event_data.location,
      })) || [];

    // 构建位置历史
    const locationHistory = locations?.map((l: any) => ({
      lat: l.latitude,
      lng: l.longitude,
      timestamp: l.timestamp,
      address: l.address,
    })) || [];

    let predictionResult: PredictionResult;

    if (mode === 'rule') {
      // 纯规则预测
      const ruleAnalysis = ruleBasedAnalysis(shipment, temperatureData);
      predictionResult = {
        riskLevel: ruleAnalysis.riskLevel,
        riskScore: ruleAnalysis.score,
        confidence: 85,
        predictions: generatePredictions(shipment, ruleAnalysis.score),
        recommendations: generateRecommendations(ruleAnalysis.riskLevel),
        analysis: `基于规则分析，当前风险等级为 ${ruleAnalysis.riskLevel}（评分: ${ruleAnalysis.score}）。\n\n主要影响因素:\n${ruleAnalysis.factors.map(f => `- ${f}`).join('\n')}`,
        ruleBasedScore: ruleAnalysis.score,
      };
    } else if (mode === 'llm') {
      // 纯 LLM 预测
      predictionResult = await llmPrediction(shipment, temperatureData, locationHistory, similarShipments || [], request);
      predictionResult.llmScore = predictionResult.riskScore;
    } else {
      // 混合模式（推荐）
      const ruleAnalysis = ruleBasedAnalysis(shipment, temperatureData);
      
      // 如果有足够的历史数据，使用 LLM 深度分析
      if (temperatureData.length >= 5) {
        predictionResult = await llmPrediction(shipment, temperatureData, locationHistory, similarShipments || [], request);
        predictionResult.llmScore = predictionResult.riskScore;
        
        // 融合规则分析和 LLM 结果
        const combinedScore = (ruleAnalysis.score * 0.3) + (predictionResult.riskScore * 0.7);
        predictionResult.riskScore = Math.round(combinedScore);
        predictionResult.riskLevel = determineRiskLevel(predictionResult.riskScore);
        predictionResult.ruleBasedScore = ruleAnalysis.score;
        
        // 更新分析说明
        predictionResult.analysis += `\n\n**混合分析结果**\n- 规则分析: ${ruleAnalysis.score}分 (${ruleAnalysis.riskLevel})\n- AI 分析: ${predictionResult.llmScore}分\n- 综合评分: ${predictionResult.riskScore}分 (${predictionResult.riskLevel})\n\n规则因素: ${ruleAnalysis.factors.join(', ')}`;
      } else {
        // 数据不足，仅使用规则分析
        predictionResult = {
          riskLevel: ruleAnalysis.riskLevel,
          riskScore: ruleAnalysis.score,
          confidence: 70,
          predictions: generatePredictions(shipment, ruleAnalysis.score),
          recommendations: generateRecommendations(ruleAnalysis.riskLevel),
          analysis: `历史数据不足 (${temperatureData.length} 条记录)，仅使用规则分析。\n\n当前风险等级: ${ruleAnalysis.riskLevel}（评分: ${ruleAnalysis.score}）。\n\n影响因素:\n${ruleAnalysis.factors.map(f => `- ${f}`).join('\n')}\n\n建议: 继续收集更多温度数据以获得更准确的 AI 预测。`,
          ruleBasedScore: ruleAnalysis.score,
        };
      }
    }

    // 保存预测结果到 risk_predictions 表
    await supabase
      .from('risk_predictions')
      .insert({
        shipment_id: shipmentId,
        prediction_time: new Date().toISOString(),
        prediction_window: 72,
        risk_level: predictionResult.riskLevel,
        risk_score: predictionResult.riskScore,
        temperature_deviation: shipment.current_temperature ? Math.abs(shipment.current_temperature - shipment.temperature_requirement) : 0,
        confidence: predictionResult.confidence,
        factors: {
          ruleBased: predictionResult.ruleBasedScore,
          llm: predictionResult.llmScore,
          temperatureDataCount: temperatureData.length,
        },
        recommendations: predictionResult.recommendations,
      });

    // 同时记录到 shipment_events
    await supabase
      .from('shipment_events')
      .insert({
        shipment_id: shipmentId,
        event_type: 'prediction',
        severity: predictionResult.riskLevel === 'critical' || predictionResult.riskLevel === 'high' ? 'high' : 'low',
        event_title: `AI 风险预测`,
        description: `AI 风险预测: ${predictionResult.riskLevel}级 (评分: ${predictionResult.riskScore})`,
        event_data: {
          prediction: predictionResult,
          mode,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

    // 自动创建风险预警（当风险等级为 high 或 critical 时）
    if (predictionResult.riskLevel === 'high' || predictionResult.riskLevel === 'critical') {
      try {
        await supabase.from('risk_alerts').insert({
          shipment_id: shipmentId,
          alert_type: 'risk_prediction',
          severity: predictionResult.riskLevel,
          message: `AI 预测检测到${predictionResult.riskLevel === 'critical' ? '严重' : '高'}风险（评分: ${predictionResult.riskScore}）`,
          detail: {
            riskLevel: predictionResult.riskLevel,
            riskScore: predictionResult.riskScore,
            confidence: predictionResult.confidence,
            predictions: predictionResult.predictions,
            recommendations: predictionResult.recommendations,
            mode,
            ruleBasedScore: predictionResult.ruleBasedScore,
            llmScore: predictionResult.llmScore,
          },
          is_read: false,
          is_handled: false,
          alerted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });

        // 如果是严重风险，创建额外的紧急预警
        if (predictionResult.riskLevel === 'critical') {
          await supabase.from('risk_alerts').insert({
            shipment_id: shipmentId,
            alert_type: 'urgent_action',
            severity: 'critical',
            message: '紧急：温度严重超出安全范围，需立即处理！',
            detail: {
              urgency: 'high',
              actionRequired: true,
              recommendedActions: predictionResult.recommendations.slice(0, 3),
              riskScore: predictionResult.riskScore,
            },
            is_read: false,
            is_handled: false,
            alerted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        }
      } catch (alertError) {
        console.error('创建风险预警失败:', alertError);
        // 不影响预测结果，仅记录错误
      }
    }

    return NextResponse.json({
      success: true,
      data: predictionResult,
      meta: {
        mode,
        temperatureDataCount: temperatureData.length,
        locationDataCount: locationHistory.length,
        similarShipmentsCount: similarShipments?.length || 0,
      },
    });
  } catch (error) {
    console.error('预测分析失败:', error);
    return NextResponse.json(
      { error: '预测分析失败' },
      { status: 500 }
    );
  }
}

async function llmPrediction(
  shipment: any,
  temperatureData: TemperatureData[],
  locationHistory: any[],
  similarShipments: any[],
  request: NextRequest
): Promise<PredictionResult> {
  const analysisPrompt = buildAnalysisPrompt({
    shipment,
    temperatureData,
    locationHistory,
    similarShipments,
  });

  // 调试信息：分析提示词
  console.log('=== DeepSeek API调试信息 ===');
  console.log('分析提示词长度:', analysisPrompt.length);
  console.log('运输批次信息:');
  console.log('- 批次号:', shipment.shipment_number);
  console.log('- 当前温度:', shipment.current_temperature);
  console.log('- 温度要求:', shipment.temperature_requirement);
  console.log('- 状态:', shipment.status);
  console.log('- 温度数据条数:', temperatureData.length);

  try {
     // 使用原生fetch调用DeepSeek API
     const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-fad3d081897c4e1d9119796a5fa20f92';
     
     console.log('API密钥前10位:', apiKey.substring(0, 10) + '...');
     console.log('开始调用DeepSeek API...');
     
     const apiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${apiKey}`
       },
       body: JSON.stringify({
         model: 'deepseek-chat',
         messages: [
           {
             role: 'system',
             content: `你是一位资深的冷链物流风险分析专家。你的任务是基于历史数据和环境因素，预测未来24-72小时内温度波动风险，并提供专业的建议。

输出格式要求（必须严格遵循 JSON 格式）：
\`\`\`json
{
  "riskLevel": "low|medium|high|critical",
  "riskScore": 0-100,
  "confidence": 0-100,
  "predictions": [
    {
      "timeframe": "24小时内|48小时内|72小时内",
      "expectedTempRange": [最低温度, 最高温度],
      "probability": 0-100,
      "factors": ["影响因素1", "影响因素2"]
    }
  ],
  "recommendations": ["建议1", "建议2", "建议3"],
  "analysis": "详细分析说明..."
}
\`\`\`

评估标准：
- riskLevel: critical (>90分), high (70-90分), medium (50-70分), low (<50分)
- 考虑因素：历史温度波动、当前温度与要求温度的差距、运输距离、包装类型、天气条件、同类型产品历史表现
- probability: 温度超出范围的概率`
           },
           {
             role: 'user',
             content: analysisPrompt
           }
         ],
         temperature: 0.7,
         max_tokens: 2000,
       })
     });
 
     console.log('API响应状态:', apiResponse.status, apiResponse.statusText);
     
     if (!apiResponse.ok) {
       const errorText = await apiResponse.text();
       console.error('API请求失败详情:');
       console.error('状态码:', apiResponse.status);
       console.error('错误信息:', errorText);
       throw new Error(`DeepSeek API请求失败: ${apiResponse.status} ${apiResponse.statusText}`);
     }
 
     const data = await apiResponse.json();
     console.log('API响应数据:');
     console.log('- 模型:', data.model);
     console.log('- 使用token数:', data.usage?.total_tokens);
     console.log('- 响应内容长度:', data.choices[0]?.message?.content?.length || 0);
     
     const response = data.choices[0]?.message?.content;
     if (!response) {
       console.error('API返回空响应，完整数据:', JSON.stringify(data, null, 2));
       throw new Error('DeepSeek API返回空响应');
     }

    console.log('原始响应内容:');
    console.log(response.substring(0, 200) + '...');

    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      console.log('找到JSON代码块，尝试解析...');
      try {
        const result = JSON.parse(jsonMatch[1]);
        console.log('JSON解析成功，风险等级:', result.riskLevel, '评分:', result.riskScore);
        return result;
      } catch (e) {
        console.error('DeepSeek JSON解析失败:', e);
        console.error('JSON内容:', jsonMatch[1]);
      }
    } else {
      console.log('未找到JSON代码块，尝试直接解析整个响应...');
    }

    // 尝试直接解析JSON
    try {
      const result = JSON.parse(response);
      console.log('直接JSON解析成功，风险等级:', result.riskLevel, '评分:', result.riskScore);
      return result;
    } catch (e) {
      console.error('直接JSON解析失败:', e);
      console.error('响应内容:', response);
    }
  } catch (error) {
     console.error('=== DeepSeek API调用失败 ===');
     console.error('错误信息:', error);
     console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
     
     // API调用失败时，回退到增强的规则分析
     console.log('开始降级到增强规则分析...');
     const ruleAnalysis = ruleBasedAnalysis(shipment, temperatureData);
     console.log('规则分析结果 - 原始分数:', ruleAnalysis.score, '风险等级:', ruleAnalysis.riskLevel);
     console.log('影响因素:', ruleAnalysis.factors);
     
     let enhancedScore = ruleAnalysis.score;
     let enhancedFactors = [...ruleAnalysis.factors];
     
     if (shipment.route?.distance > 500) {
       enhancedScore += 10;
       enhancedFactors.push('长距离运输风险增加');
       console.log('运输距离增强: +10分');
     }
     
     if (temperatureData.length > 0) {
       const temps = temperatureData.map(d => d.temperature);
       const fluctuation = Math.max(...temps) - Math.min(...temps);
       if (fluctuation > 3) {
         enhancedScore += 15;
         enhancedFactors.push('历史温度波动较大');
         console.log('温度波动增强: +15分');
       }
     }
     
     enhancedScore = Math.min(100, Math.max(0, enhancedScore));
     const enhancedRiskLevel = determineRiskLevel(enhancedScore);
     
     console.log('最终增强分析 - 分数:', enhancedScore, '风险等级:', enhancedRiskLevel);
     
     return {
       riskLevel: enhancedRiskLevel,
       riskScore: enhancedScore,
       confidence: 70,
       predictions: generatePredictions(shipment, enhancedScore),
       recommendations: generateRecommendations(enhancedRiskLevel),
       analysis: `DeepSeek API调用失败，使用增强规则分析模式。\n\n风险等级: ${enhancedRiskLevel}（评分: ${enhancedScore}）。\n\n影响因素:\n${enhancedFactors.map(f => '- ' + f).join('\\n')}\n\nAPI错误: ${error instanceof Error ? error.message : '未知错误'}`,
       llmScore: enhancedScore,
     };
   }

  // 如果所有尝试都失败，回退到默认预测
  return getDefaultPrediction(shipment, temperatureData);
}

function generatePredictions(shipment: any, riskScore: number): PredictionResult['predictions'] {
  const baseTemp = shipment.temperature_requirement;
  const riskMultiplier = riskScore / 50; // 风险越高，预测范围越大

  return [
    {
      timeframe: '24小时内',
      expectedTempRange: [baseTemp - 2 * riskMultiplier, baseTemp + 2 * riskMultiplier],
      probability: Math.min(100, riskScore * 1.2),
      factors: ['基于当前温度趋势', '运输时间因素'],
    },
    {
      timeframe: '48小时内',
      expectedTempRange: [baseTemp - 3 * riskMultiplier, baseTemp + 3 * riskMultiplier],
      probability: Math.min(100, riskScore * 1.3),
      factors: ['累计运输时间', '设备性能'],
    },
    {
      timeframe: '72小时内',
      expectedTempRange: [baseTemp - 4 * riskMultiplier, baseTemp + 4 * riskMultiplier],
      probability: Math.min(100, riskScore * 1.4),
      factors: ['设备老化', '环境温度变化'],
    },
  ];
}

function generateRecommendations(riskLevel: string): string[] {
  const baseRecommendations = [
    '继续每 30 分钟记录一次温度数据',
    '确保制冷设备正常运行',
    '保持车辆通风良好',
  ];

  const riskSpecific: Record<string, string[]> = {
    critical: [
      '立即检查温度控制系统',
      '考虑更换备用制冷设备',
      '联系紧急维修人员',
      '准备应急预案，考虑中转',
      '每小时向客户汇报状态',
    ],
    high: [
      '加强温度监控频率',
      '检查保温层完整性',
      '提前准备备用方案',
      '每 2 小时汇报一次状态',
    ],
    medium: [
      '密切关注温度变化',
      '定期检查设备状态',
      '保持与司机的通讯',
    ],
    low: [
      '保持正常监控频率',
      '按计划完成运输',
    ],
  };

  return [...baseRecommendations, ...(riskSpecific[riskLevel] || [])];
}

function determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function buildAnalysisPrompt(data: {
  shipment: any;
  temperatureData: TemperatureData[];
  locationHistory: any[];
  similarShipments: any[];
}): string {
  const { shipment, temperatureData, locationHistory, similarShipments } = data;

  let prompt = `请分析以下冷链运送批次的温度波动风险：

【批次信息】
- 批次号: ${shipment.shipment_number}
- 产品类型: ${shipment.product_type}
- 数量: ${shipment.quantity}
- 出发地: ${shipment.origin}
- 目的地: ${shipment.destination}
- 温度要求: ${shipment.temperature_requirement}°C
- 当前温度: ${shipment.current_temperature || '未知'}°C
- 当前湿度: ${shipment.current_humidity || '未知'}%
- 包装类型: ${shipment.packaging}
- 状态: ${shipment.status}
- 出发时间: ${shipment.departure_time}
- 预计到达时间: ${shipment.estimated_arrival_time || '未知'}
`;

  if (temperatureData.length > 0) {
    prompt += `\n【温度历史数据】（最近 ${Math.min(temperatureData.length, 20)} 条记录）\n`;
    temperatureData.slice(-20).forEach((d, i) => {
      prompt += `${i + 1}. ${new Date(d.timestamp).toLocaleString('zh-CN')} - 温度: ${d.temperature}°C, 湿度: ${d.humidity}%${d.location ? ', 位置: ' + d.location : ''}\n`;
    });

    if (temperatureData.length > 1) {
      const temps = temperatureData.map(d => d.temperature);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      const variance = temps.reduce((a, b) => a + Math.pow(b - avgTemp, 2), 0) / temps.length;

      prompt += `\n温度统计: 平均 ${avgTemp.toFixed(2)}°C, 最低 ${minTemp}°C, 最高 ${maxTemp}°C, 波动范围 ${(maxTemp - minTemp).toFixed(2)}°C, 方差 ${variance.toFixed(2)}\n`;
    }
  }

  if (locationHistory.length > 0) {
    prompt += `\n【位置历史】（共 ${locationHistory.length} 个位置点）\n`;
    locationHistory.slice(-10).forEach((l, i) => {
      prompt += `${i + 1}. ${new Date(l.timestamp).toLocaleString('zh-CN')} - ${l.address || `${l.lat}, ${l.lng}`}\n`;
    });
  }

  if (similarShipments.length > 0) {
    prompt += `\n【同类型产品历史表现】（${similarShipments.length} 个相似批次）\n`;
    similarShipments.forEach((s, i) => {
      prompt += `${i + 1}. ${s.shipment_number} - ${s.origin}→${s.destination}, 状态: ${s.status}, 风险等级: ${s.risk_level}\n`;
    });
  }

  prompt += `\n请基于以上数据，预测未来 24-72 小时内的温度波动风险，并给出专业的建议。`;

  return prompt;
}

function getDefaultPrediction(shipment: any, temperatureData: TemperatureData[]): PredictionResult {
  // 使用规则分析作为默认预测，避免过于保守
  const ruleAnalysis = ruleBasedAnalysis(shipment, temperatureData);
  
  return {
    riskLevel: ruleAnalysis.riskLevel,
    riskScore: ruleAnalysis.score,
    confidence: temperatureData.length > 5 ? 75 : 60,
    predictions: generatePredictions(shipment, ruleAnalysis.score),
    recommendations: generateRecommendations(ruleAnalysis.riskLevel),
    analysis: `AI分析服务暂时不可用，使用规则分析模式。\n\n当前风险等级: ${ruleAnalysis.riskLevel}（评分: ${ruleAnalysis.score}）。\n\n影响因素:\n${ruleAnalysis.factors.map(f => '- ' + f).join('\\n')}\n\n建议: 检查AI服务配置以启用更准确的预测。`,
    ruleBasedScore: ruleAnalysis.score,
  };
}

// 批量预测接口
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'in_transit';
    const limit = parseInt(searchParams.get('limit') || '5');

    const supabase = getSupabaseClient();

    // 获取符合条件的批次
    const { data: shipments } = await supabase
      .from('shipments')
      .select('*')
      .eq('status', status)
      .limit(limit);

    if (!shipments || shipments.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: '没有符合条件的批次',
      });
    }

    // 批量预测
    const results = [];
    for (const shipment of shipments) {
      try {
        // 获取温度数据
        const { data: events } = await supabase
          .from('shipment_events')
          .select('*')
          .eq('shipment_id', shipment.id)
          .order('timestamp', { ascending: true })
          .limit(20);

        const temperatureData: TemperatureData[] = events
          ?.filter((e: any) => e.event_type === 'temperature_reading' && e.event_data?.temperature !== undefined)
          .map((e: any) => ({
            timestamp: e.timestamp,
            temperature: e.event_data.temperature,
            humidity: e.event_data.humidity || 0,
          })) || [];

        // 规则分析
        const ruleAnalysis = ruleBasedAnalysis(shipment, temperatureData);

        results.push({
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipment_number,
          productType: shipment.product_type,
          origin: shipment.origin,
          destination: shipment.destination,
          prediction: {
            riskLevel: ruleAnalysis.riskLevel,
            riskScore: ruleAnalysis.score,
            factors: ruleAnalysis.factors,
          },
        });
      } catch (error) {
        console.error(`批次 ${shipment.id} 预测失败:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `成功预测 ${results.length} 个批次`,
    });
  } catch (error) {
    console.error('批量预测失败:', error);
    return NextResponse.json(
      { error: '批量预测失败' },
      { status: 500 }
    );
  }
}
