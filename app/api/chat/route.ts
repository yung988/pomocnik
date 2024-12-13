import { Duration } from '@/lib/duration'
import { getModelClient, getDefaultMode } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { toPrompt } from '@/lib/prompt'
import ratelimit from '@/lib/ratelimit'
import { fragmentSchema as schema } from '@/lib/schema'
import { Templates } from '@/lib/templates'
import { streamObject, LanguageModel, CoreMessage } from 'ai'
import { Message } from '@/lib/messages'

export const maxDuration = 60

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

export async function POST(req: Request) {
  const {
    messages,
    userID,
    template,
    model,
    config,
  }: {
    messages: CoreMessage[]
    userID: string
    template: Templates
    model: LLMModel
    config: LLMModelConfig
  } = await req.json()

  const limit = !config.apiKey
    ? await ratelimit(
        userID,
        rateLimitMaxRequests,
        ratelimitWindow,
      )
    : false

  if (limit) {
    return new Response('You have reached your request limit for the day.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.amount.toString(),
        'X-RateLimit-Remaining': limit.remaining.toString(),
        'X-RateLimit-Reset': limit.reset.toString(),
      },
    })
  }

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  // Convert CoreMessage[] to Message[]
  const unifiedMessages: Message[] = messages.map(msg => ({
    role: msg.role === 'system' ? 'assistant' : msg.role === 'user' ? 'user' : 'assistant',
    content: typeof msg.content === 'string'
      ? [{ type: 'text', text: msg.content }]
      : Array.isArray(msg.content)
      ? msg.content.map(c => typeof c === 'string' ? { type: 'text', text: c } : { type: 'text', text: String(c) })
      : [{ type: 'text', text: String(msg.content) }]
  }))

  // Add system prompt
  unifiedMessages.unshift({
    role: 'user',
    content: [{ type: 'text', text: toPrompt(template) }]
  })

  // Get response from model
  const response = await modelClient.invoke({
    messages: unifiedMessages,
    stream: false
  })

  const text = await new Response(response).text()

  // Stream the object
  const stream = await streamObject({
    model: modelClient as unknown as LanguageModel,
    schema,
    system: toPrompt(template),
    prompt: text,
    mode: getDefaultMode(model),
    ...modelParams,
  })

  return stream.toTextStreamResponse()
}