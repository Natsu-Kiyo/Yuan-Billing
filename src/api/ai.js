// AI 分析 API：智谱 GLM 模型流式调用（聊天 + 生成报告）
const API_BASE = 'https://open.bigmodel.cn/api/paas/v4'
const API_KEY = import.meta.env.VITE_ZHIPU_API_KEY

/** 将统计数据构建为结构化文本上下文 */
function buildContext(stats) {
  const parts = []

  if (stats.totalExpense > 0 || stats.totalIncome > 0) {
    parts.push(`总支出: ¥${stats.totalExpense.toFixed(2)}，总收入: ¥${stats.totalIncome.toFixed(2)}，结余: ¥${stats.balance.toFixed(2)}`)
  }

  if (stats.expenseByCategory?.length) {
    const top = stats.expenseByCategory.slice(0, 5)
      .map((c) => `${c.name}(¥${c.value.toFixed(2)})`)
      .join('、')
    parts.push(`支出分类 Top5: ${top}`)
  }

  if (stats.incomeByCategory?.length) {
    const top = stats.incomeByCategory.slice(0, 3)
      .map((c) => `${c.name}(¥${c.value.toFixed(2)})`)
      .join('、')
    parts.push(`收入分类: ${top}`)
  }

  if (stats.monthlyTrend?.length) {
    const trend = stats.monthlyTrend
      .map((m) => `${m.month}: 支出¥${m.expense.toFixed(2)} 收入¥${m.income.toFixed(2)}`)
      .join('; ')
    parts.push(`月度趋势: ${trend}`)
  }

  if (stats.averageDailyExpense > 0) {
    parts.push(`日均支出: ¥${stats.averageDailyExpense.toFixed(2)}`)
  }

  return parts.join('\n')
}

/** 构建聊天模式的 System Prompt */
function buildSystemPrompt(stats) {
  return `你是一位专业的个人财务管理顾问，专注于帮助大学生分析消费习惯、优化支出结构、制定合理的预算计划。

你的回复风格：
- 简洁专业，用数据说话
- 给出具体可操作的建议
- 使用友好的语气，像朋友一样交流
- 适当使用 emoji 增加亲和力
- 回复控制在 300 字以内

以下是用户当前的财务数据：
${stats ? buildContext(stats) : '暂无数据'}

请基于以上数据回答用户的问题。如果数据为空，请引导用户先添加账单记录。`
}

/** 构建报告生成模式的 System Prompt */
function buildReportPrompt(stats) {
  return `你是一位专业的个人财务管理顾问。请根据用户的财务数据生成一份简洁的消费分析报告。

报告格式要求：
1. 📊 总体概况（一句话总结收支状况）
2. 🔍 消费结构分析（指出主要支出方向）
3. 💡 优化建议（2-3条具体可行的建议）
4. 🎯 下月预算建议

回复控制在 400 字以内，使用友好的语气。`
}

/** 通用 SSE 流式请求处理 */
async function streamChat({ messages, stats, systemPrompt, onChunk, onDone, onError }) {
  if (!API_KEY) {
    onError(new Error('请先在 .env 文件中配置 VITE_ZHIPU_API_KEY'))
    return
  }

  const prompt = systemPrompt || buildSystemPrompt(stats)

  const body = {
    model: 'glm-4-flash',
    messages: [
      { role: 'system', content: prompt },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 1024,
    stream: true,
  }

  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `请求失败 (${response.status})`)
    }

    // 读取 SSE 流，逐 chunk 输出
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留未完成的行

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const dataStr = trimmed.slice(6)
        if (dataStr === '[DONE]') continue

        try {
          const parsed = JSON.parse(dataStr)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            onChunk(content)
          }
        } catch {
          // 跳过无法解析的 chunk
        }
      }
    }

    onDone()
  } catch (err) {
    onError(err)
  }
}

/** 发送聊天消息（流式） */
export async function sendMessageStream({ messages, stats, onChunk, onDone, onError }) {
  await streamChat({ messages, stats, onChunk, onDone, onError })
}

/** 生成消费分析报告（流式） */
export async function generateReportStream({ stats, onChunk, onDone, onError }) {
  const messages = [
    { role: 'user', content: `以下是我的财务数据，请帮我生成分析报告：\n${buildContext(stats)}` },
  ]
  await streamChat({
    messages,
    stats,
    systemPrompt: buildReportPrompt(stats),
    onChunk,
    onDone,
    onError,
  })
}