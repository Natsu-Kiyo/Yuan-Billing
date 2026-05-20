// AI 对话组合式函数：对 useAIStore 的响应式封装
import { storeToRefs } from 'pinia'
import { useAIStore } from '@/stores/ai'

export function useAI() {
  const store = useAIStore()
  const { messages, loading, error, streamingContent, hasMessages } = storeToRefs(store)

  return {
    messages,
    loading,
    error,
    streamingContent,
    hasMessages,
    sendMessage: store.sendMessage,
    generateReport: store.generateReport,
    clearMessages: store.clearMessages,
  }
}