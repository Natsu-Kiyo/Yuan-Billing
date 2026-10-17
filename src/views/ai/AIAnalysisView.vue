<script setup>
// AI 分析页：流式对话、快捷提问、消费报告生成、Markdown 渲染
import { ref, onMounted, nextTick, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import { useAuth } from '@/composables/useAuth'
import { useAI } from '@/composables/useAI'
import { useStatistics } from '@/composables/useStatistics'
import { formatAmount } from '@/utils/format'

// Markdown 渲染器：支持换行和自动链接
const md = new MarkdownIt({ breaks: true, linkify: true })

const { userId } = useAuth()
const {
  messages, loading, streamingContent,
  sendMessage, generateReport, clearMessages,
} = useAI()
const {
  totalExpense, totalIncome, balance, billCount,
  expenseByCategory, incomeByCategory, monthlyTrend, averageDailyExpense,
  fetchStats,
} = useStatistics()

const inputText = ref('')
const chatContainer = ref(null)
const inputFocused = ref(false)

// 预设快捷提问
const quickQuestions = [
  '分析一下我的消费习惯',
  '帮我制定一个省钱计划',
  '我的支出结构健康吗？',
  '下个月预算建议',
  '如何减少不必要的开支？',
]

// 初始化统计上下文
onMounted(async () => {
  if (!userId.value) return
  try {
    await fetchStats()
  } catch (err) {
    ElMessage.error(err.message || '加载财务数据失败')
  }
})

// 新消息到达或流式输出时，自动滚动到底部
watch(
  () => [messages.value.length, streamingContent.value],
  () => {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    })
  }
)

// 已完成消息的渲染结果按内容缓存，避免流式输出时反复解析整段历史
const markdownCache = new Map()
const MARKDOWN_CACHE_LIMIT = 200

/**
 * 将 Markdown 渲染为安全的 HTML
 * @param {string} content Markdown 原文
 * @param {boolean} cacheable 内容是否不再变化（完成消息可缓存，流式片段不缓存）
 */
function renderMarkdown(content, cacheable = false) {
  const raw = content || ''

  if (cacheable && markdownCache.has(raw)) {
    return markdownCache.get(raw)
  }

  const cleaned = raw.replace(/\n{2,}/g, '\n')
  let html = md.render(cleaned)
  html = html.replace(/<p>\s*<\/p>/g, '')
  html = html.replace(/(<br\s*\/?>\s*){2,}/g, '<br>')

  if (cacheable) {
    if (markdownCache.size >= MARKDOWN_CACHE_LIMIT) markdownCache.clear()
    markdownCache.set(raw, html)
  }

  return html
}

/** 构建传给 AI 的统计数据上下文 */
function buildStats() {
  return {
    totalExpense: totalExpense.value,
    totalIncome: totalIncome.value,
    balance: balance.value,
    billCount: billCount.value,
    expenseByCategory: expenseByCategory.value,
    incomeByCategory: incomeByCategory.value,
    monthlyTrend: monthlyTrend.value,
    averageDailyExpense: averageDailyExpense.value,
  }
}

/** 发送消息（Enter 触发，Shift+Enter 换行） */
function handleSend() {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  sendMessage(text, buildStats())
  inputText.value = ''
}

/** 点击快捷提问 */
function handleQuickQuestion(q) {
  inputText.value = q
  handleSend()
}

/** 生成消费分析报告 */
function handleGenerateReport() {
  generateReport(buildStats())
}

function handleKeydown(e) {
  // 输入法组合输入中（如中文选词）按回车不发送
  if (e.isComposing || e.keyCode === 229) return
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

/** 格式化时间戳为 HH:MM */
function formatTime(ts) {
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">AI 消费分析</h1>
        <p class="page-subtitle">智能分析消费习惯，获取个性化理财建议</p>
      </div>
      <el-button
        type="primary"
        size="large"
        :loading="loading"
        @click="handleGenerateReport"
      >
        <el-icon :size="16"><el-icon-document></el-icon-document></el-icon>
        生成分析报告
      </el-button>
    </div>

    <div class="ai-body">
      <div class="ai-chat-panel">
        <div class="chat-messages" ref="chatContainer">
          <div v-if="!messages.length && !loading" class="chat-empty">
            <div class="empty-icon">
              <el-icon :size="48"><el-icon-chat-line-round></el-icon-chat-line-round></el-icon>
            </div>
            <h3>AI 消费顾问</h3>
            <p>我可以帮你分析消费习惯、制定预算计划、提供省钱建议</p>
            <div class="quick-questions">
              <el-tag
                v-for="q in quickQuestions"
                :key="q"
                class="quick-tag"
                :disable-transitions="false"
                @click="handleQuickQuestion(q)"
              >
                {{ q }}
              </el-tag>
            </div>
          </div>

          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="chat-message"
            :class="msg.role"
          >
            <div class="message-avatar">
              <el-icon v-if="msg.role === 'user'" :size="18"><el-icon-user></el-icon-user></el-icon>
              <el-icon v-else :size="18"><el-icon-cpu></el-icon-cpu></el-icon>
            </div>
            <div class="message-body">
              <div class="message-bubble" :class="msg.role">
                <div
                  v-if="msg.role === 'assistant'"
                  class="message-content markdown-body"
                  v-html="renderMarkdown(msg.content, true)"
                ></div>
                <div v-else class="message-content">{{ msg.content }}</div>
              </div>
              <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
            </div>
          </div>

          <div v-if="loading" class="chat-message assistant">
            <div class="message-avatar">
              <el-icon :size="18"><el-icon-cpu></el-icon-cpu></el-icon>
            </div>
            <div class="message-body">
              <div class="message-bubble assistant">
                <div
                  v-if="streamingContent"
                  class="message-content markdown-body"
                  v-html="renderMarkdown(streamingContent)"
                ></div>
                <div v-else class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-footer">
          <div class="chat-input-area" :class="{ focused: inputFocused }">
            <el-input
              v-model="inputText"
              type="textarea"
              :rows="1"
              placeholder="输入你的问题，例如：分析我的消费习惯..."
              :disabled="loading"
              resize="none"
              @keydown="handleKeydown"
              @focus="inputFocused = true"
              @blur="inputFocused = false"
            />
            <el-button
              type="primary"
              :disabled="!inputText.trim() || loading"
              @click="handleSend"
            >
              <el-icon :size="18"><el-icon-promotion></el-icon-promotion></el-icon>
            </el-button>
          </div>
          <el-button
            v-if="messages.length"
            class="clear-btn"
            size="small"
            text
            @click="clearMessages"
          >
            清空对话
          </el-button>
        </div>
      </div>

      <div class="ai-stats-panel">
        <h3 class="panel-title">当前财务概览</h3>
        <div class="stat-item">
          <span class="stat-label">总支出</span>
          <span class="stat-value expense">{{ formatAmount(totalExpense) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总收入</span>
          <span class="stat-value income">{{ formatAmount(totalIncome) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">结余</span>
          <span class="stat-value" :class="balance >= 0 ? 'income' : 'expense'">
            {{ formatAmount(balance) }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">日均支出</span>
          <span class="stat-value">{{ formatAmount(averageDailyExpense) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">账单数</span>
          <span class="stat-value">{{ billCount }} 笔</span>
        </div>

        <div v-if="expenseByCategory.length" class="top-categories">
          <h4 class="section-label">支出 Top 3</h4>
          <div
            v-for="cat in expenseByCategory.slice(0, 3)"
            :key="cat.name"
            class="category-row"
          >
            <span class="cat-dot" :style="{ background: cat.color }"></span>
            <span class="cat-name">{{ cat.name }}</span>
            <span class="cat-amount">{{ formatAmount(cat.value) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.page-container {
  height: calc(100vh - var(--navbar-height));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-width: none;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;
  margin-bottom: var(--spacing-md);
}

.ai-body {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
  min-height: 0;

  @media (max-width: 900px) {
    flex-direction: column;
  }
}

.ai-chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-height: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;
  }
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  padding: var(--spacing-xl);

  .empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-brand);
    margin-bottom: var(--spacing-md);
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-xs);
  }

  p {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-lg);
  }
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  justify-content: center;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);

  &:hover {
    border-color: var(--color-brand);
    color: var(--color-brand);
    background: rgba(99, 102, 241, 0.05);
  }
}

.chat-message {
  display: flex;
  gap: var(--spacing-sm);
  max-width: 85%;

  &.user {
    align-self: flex-end;
    flex-direction: row-reverse;

    .message-avatar {
      background: var(--color-brand);
      color: #fff;
    }

    .message-time {
      text-align: right;
    }
  }

  &.assistant {
    align-self: flex-start;

    .message-avatar {
      background: var(--color-bg-secondary);
      color: var(--color-brand);
      border: 1px solid var(--color-border);
    }
  }
}

.message-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.message-bubble {
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  box-shadow: var(--shadow-sm);

  &.user {
    background: var(--color-brand);
    color: #fff;
    border-radius: 16px 4px 16px 16px;
    border: 1px solid var(--color-brand-dark);
  }

  &.assistant {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border-radius: 4px 16px 16px 16px;
    border: 1px solid var(--color-border);
  }
}

.message-content {
  white-space: pre-wrap;
}

.markdown-body {
  :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
    margin: 4px 0 2px;
    font-weight: 600;
    line-height: 1.3;
  }

  :deep(h1) { font-size: 17px; }
  :deep(h2) { font-size: 15px; }
  :deep(h3) { font-size: 14px; }

  :deep(p) {
    margin: 0;
  }

  :deep(ul), :deep(ol) {
    padding-left: 18px;
    margin: 0;
  }

  :deep(li) {
    margin: 0;
  }

  :deep(code) {
    background: rgba(99, 102, 241, 0.08);
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 13px;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  :deep(pre) {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    overflow-x: auto;
    margin: 4px 0;

    code {
      background: none;
      padding: 0;
    }
  }

  :deep(blockquote) {
    border-left: 3px solid var(--color-brand);
    padding-left: var(--spacing-sm);
    margin: 4px 0;
    color: var(--color-text-secondary);
  }

  :deep(strong) {
    font-weight: 600;
  }

  :deep(a) {
    color: var(--color-brand);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 4px 0;

    th, td {
      border: 1px solid var(--color-border);
      padding: 4px 8px;
      text-align: left;
      font-size: 13px;
    }

    th {
      background: var(--color-bg-secondary);
      font-weight: 600;
    }
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 8px 0;
  }
}

.message-time {
  font-size: 11px;
  color: var(--color-text-tertiary);
  padding: 0 4px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;

  span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-text-tertiary);
    animation: typing 1.4s infinite ease-in-out;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
  30% { opacity: 1; transform: scale(1); }
}

.chat-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.chat-input-area {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
  width: 100%;
  transition: border-color 0.2s;

  :deep(.el-textarea__inner) {
    background: var(--color-bg-secondary);
    border-color: transparent;
    box-shadow: none;
    font-size: 14px;
    line-height: 1.5;
    padding: 10px 14px;
    border-radius: var(--radius-md);

    &:focus {
      border-color: transparent;
      box-shadow: none;
    }
  }

  .el-button {
    height: 40px;
    width: 40px;
    padding: 0;
    border-radius: 50%;
    flex-shrink: 0;
  }
}

.clear-btn {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.ai-stats-panel {
  width: 240px;
  flex-shrink: 0;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  align-self: flex-start;
  position: sticky;
  top: 0;

  @media (max-width: 900px) {
    display: none;
  }
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs);

  @media (max-width: 900px) {
    width: 100%;
    margin: 0;
  }
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border);

  &:last-of-type {
    border-bottom: none;
  }

  @media (max-width: 900px) {
    flex: 1;
    min-width: 100px;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    border-bottom: none;
    padding: 0;
  }
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);

  &.expense { color: var(--color-expense); }
  &.income { color: var(--color-income); }
}

.top-categories {
  margin-top: var(--spacing-sm);
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cat-name {
  font-size: 13px;
  color: var(--color-text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cat-amount {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}
</style>