import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sendMessageStream, generateReportStream } from '@/api/ai'

export const useAIStore = defineStore('ai', () => {
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)
  const streamingContent = ref('')

  const hasMessages = computed(() => messages.value.length > 0)

  function addUserMessage(content) {
    messages.value.push({ role: 'user', content, timestamp: Date.now() })
  }

  function addAssistantMessage(content) {
    messages.value.push({ role: 'assistant', content, timestamp: Date.now() })
  }

  function startStreaming() {
    streamingContent.value = ''
  }

  function appendStreamChunk(chunk) {
    streamingContent.value += chunk
  }

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