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