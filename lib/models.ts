import { createAnthropic } from '@ai-sdk/anthropic'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenAI } from '@ai-sdk/openai'
import { createOllama } from 'ollama-ai-provider'
import { LanguageModel } from 'ai'
import { Message } from './messages'

export interface LLMModel {
  id: string
  name: string
  description: string
  provider: string
  providerId: string
  multiModal: boolean
  contextWindow: number
  maxTokens: number
  inputTokenPrice: number
  outputTokenPrice: number
  trainingData: string
  apiKeyRequired: boolean
  baseURLConfigurable: boolean
}

export interface LLMModelConfig {
  model: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

interface UnifiedClient {
  invoke: (params: { messages: Message[], stream?: boolean }) => Promise<ReadableStream>
}

type ModelClient = ReturnType<typeof createAnthropic | typeof createMistral | typeof createOpenAI | typeof createOllama>

export function getModelClient(model: LLMModel, config: LLMModelConfig): UnifiedClient {
  const { id: modelNameString, providerId } = model
  const { apiKey, baseURL } = config

  const providerConfigs: Record<string, () => UnifiedClient> = {
    anthropic: () => {
      const client = createAnthropic({ apiKey, baseURL })(modelNameString)
      return {
        invoke: client.messages
      }
    },
    openai: () => {
      const client = createOpenAI({ apiKey, baseURL })(modelNameString)
      return {
        invoke: client.messages
      }
    },
    mistral: () => {
      const client = createMistral({ apiKey, baseURL })(modelNameString)
      return {
        invoke: client.messages
      }
    },
    ollama: () => {
      const client = createOllama({ baseURL })(modelNameString)
      return {
        invoke: client.messages
      }
    }
  }

  const createClient = providerConfigs[providerId]

  if (!createClient) {
    throw new Error(`Unsupported provider: ${providerId}`)
  }

  return createClient()
}

export function getDefaultMode(model: LLMModel) {
  return 'auto'
}