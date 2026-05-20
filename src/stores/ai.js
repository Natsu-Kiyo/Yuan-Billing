// AI 对话状态管理：消息列表、流式输出、报告生成
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sendMessageStream, generateReportStream } from '@/api/ai'

export const useAIStore = defineStore('ai', () => {
  const messages = ref([])          // 对话历史
  const loading = ref(false)        // 请求进行中
  const error = ref(null)           // 错误信息
  const streamingContent = ref('')  // 当前流式输出中的内容

  const hasMessages = computed(() => messages.value.length > 0)

  /** 添加一条用户消息 */
  function addUserMessage(content) {
    messages.value.push({ role: 'user', content, timestamp: Date.now() })
  }

  /** 添加一条 AI 消息 */
  function addAssistantMessage(content) {
    messages.value.push({ role: 'assistant', content, timestamp: Date.now() })
  }

  /** 开始新的流式响应 */
  function startStreaming() {
    streamingContent.value = ''
  }

  /** 追加流式输出片段 */
  function appendStreamChunk(chunk) {
    streamingContent.value += chunk
  }

  /** 流式响应完成，将内容加入消息列表 */
  function finishStreaming() {
    if (streamingContent.value) {
      messages.value.push({
        role: 'assistant',
        content: streamingContent.value,
        timestamp: Date.now(),
      })
    }
    streamingContent.value = ''
  }

  /** 发送聊天消息（流式） */
  async function sendMessage(content, stats) {
    if (!content.trim()) return

    addUserMessage(content)
    loading.value = true
    error.value = null
    startStreaming()

    await sendMessageStream({
      messages: messages.value
        .filter((m) => !m._streaming)
        .map((m) => ({ role: m.role, content: m.content })),
      stats,
      onChunk: appendStreamChunk,
      onDone: () => {
        finishStreaming()
        loading.value = false
      },
      onError: (err) => {
        error.value = err.message
        finishStreaming()
        if (!streamingContent.value) {
          addAssistantMessage(`抱歉，分析服务暂时不可用：${err.message}`)
        }
        loading.value = false
      },
    })
  }

  /** 生成消费分析报告（流式） */
  async function generateReport(stats) {
    loading.value = true
    error.value = null
    startStreaming()

    await generateReportStream({
      stats,
      onChunk: appendStreamChunk,
      onDone: () => {
        finishStreaming()
        loading.value = false
      },
      onError: (err) => {
        error.value = err.message
        finishStreaming()
        if (!streamingContent.value) {
          addAssistantMessage(`报告生成失败：${err.message}`)
        }
        loading.value = false
      },
    })
  }

  /** 清空对话历史 */
  function clearMessages() {
    messages.value = []
    streamingContent.value = ''
    error.value = null
  }

  return {
    messages,
    loading,
    error,
    streamingContent,
    hasMessages,
    sendMessage,
    generateReport,
    clearMessages,
  }
})