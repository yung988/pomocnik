import { Duration } from '@/lib/duration'
import { getModelClient } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { toPrompt } from '@/lib/prompt'
import ratelimit from '@/lib/ratelimit'
import { fragmentSchema as schema } from '@/lib/schema'
import { Templates, templatesToPrompt } from '@/lib/templates'
import { openai } from '@ai-sdk/openai'
import { streamObject, LanguageModel, CoreMessage, generateText } from 'ai'
import { Message } from '@/lib/messages'

export const maxDuration = 60

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

function convertToUnifiedMessages(messages: CoreMessage[]): Message[] {
  return messages.map(msg => {
    // Convert role to either 'assistant' or 'user'
    let role: 'assistant' | 'user' = msg.role === 'system' ? 'assistant' : msg.role === 'user' ? 'user' : 'assistant'

    // Convert content to our Message format
    let content = typeof msg.content === 'string'
      ? [{ type: 'text' as const, text: msg.content }]
      : Array.isArray(msg.content)
      ? msg.content.map(c => typeof c === 'string' ? { type: 'text' as const, text: c } : { type: 'text' as const, text: String(c) })
      : [{ type: 'text' as const, text: String(msg.content) }]

    return { role, content }
  })
}

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

  console.log('userID', userID)
  console.log('model', model)

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  const unifiedMessages = convertToUnifiedMessages(messages)
  unifiedMessages.unshift({
    role: 'user',
    content: [{ type: 'text', text: toPrompt(template) }],
  })

  // Convert the response to text first
  const response = await modelClient.invoke({
    messages: unifiedMessages,
    stream: false,
  })

  const text = await new Response(response).text()

  // Then use the text for object streaming
  const stream = await streamObject({
    model: openai('gpt-4o-mini') as LanguageModel,
    schema,
    system: `Please extract as required by the schema from the response. You can use one of the following templates:\n${templatesToPrompt(template)}`,
    prompt: text,
    ...modelParams,
  })

  return stream.toTextStreamResponse()
}
