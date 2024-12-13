'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session } from '@supabase/supabase-js'
import { usePostHog } from 'posthog-js/react'
import { useLocalStorage } from 'usehooks-ts'
import { experimental_useObject as useObject } from 'ai/react'
import { Message, toAISDKMessages, toMessageImage } from '@/lib/messages'
import { LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import { FragmentSchema, fragmentSchema as schema } from '@/lib/schema'
import { supabase } from '@/lib/auth'
import templates, { TemplateId } from '@/lib/templates'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { AuthViewType, useAuth } from '@/lib/auth'
import { Chat } from '@/components/chat'
import { ChatInput } from '@/components/chat-input'
import { ChatPicker } from '@/components/chat-picker'
import { ChatSettings } from '@/components/chat-settings'
import { Preview } from '@/components/preview'
import { AuthDialog } from '@/components/auth-dialog'
import { NavBar } from '@/components/navbar'
import { ChatHistory } from '@/components/chat-history'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ExtendedSession extends Session {
  apiKey?: string;
}

export default function ChatPage() {
  const router = useRouter()
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<AuthViewType>('sign_in')
  const { session, isLoading: isAuthLoading } = useAuth(setAuthDialog, setAuthView) as { session: ExtendedSession | null, isLoading: boolean }
  const [chatInput, setChatInput] = useLocalStorage('chat', '')
  const [files, setFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<'auto' | TemplateId>('auto')
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>('languageModel', {
    model: 'claude-3-5-sonnet-latest',
  })
  const posthog = usePostHog()
  const [result, setResult] = useState<ExecutionResult>()
  const [messages, setMessages] = useState<Message[]>([])
  const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>()
  const [currentTab, setCurrentTab] = useState<'code' | 'fragment'>('code')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string>()

  const currentModel = modelsList.models.find(
    (model) => model.id === languageModel.model,
  )
  const currentTemplate =
    selectedTemplate === 'auto'
      ? templates
      : { [selectedTemplate]: templates[selectedTemplate] }

  const { object, submit, isLoading, stop, error } = useObject({
    api:
      currentModel?.id === 'o1-preview' || currentModel?.id === 'o1-mini'
        ? '/api/chat-o1'
        : '/api/chat',
    schema,
    onError: (error) => {
      if (error.message.includes('request limit')) {
        setIsRateLimited(true)
      }
    },
    onFinish: async ({ object: fragment, error }) => {
      if (!error) {
        setIsPreviewLoading(true)
        posthog.capture('fragment_generated', {
          template: fragment?.template,
        })

        const response = await fetch('/api/sandbox', {
          method: 'POST',
          body: JSON.stringify({
            fragment,
            userID: session?.user?.id,
            apiKey: session?.apiKey,
          }),
        })

        const result = await response.json()
        posthog.capture('sandbox_created', { url: result.url })

        setResult(result)
        setFragment(fragment)
        setCurrentTab('fragment')
        setIsPreviewLoading(false)
      }
    },
  })

  useEffect(() => {
    if (!isAuthLoading && !session) {
      router.push('/')
    }
  }, [session, isAuthLoading, router])

  useEffect(() => {
    const pendingPrompt = localStorage.getItem('pendingPrompt')
    if (pendingPrompt) {
      setChatInput(pendingPrompt)
      localStorage.removeItem('pendingPrompt')
    }
  }, [])

  const handleNewChat = () => {
    handleClearChat()
    setSelectedChatId(undefined)
  }

  const handleSelectChat = async (chat: any) => {
    try {
      setSelectedChatId(chat.id)
      
      // Načtení zpráv pro vybraný chat
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(messages || [])
      setChatInput('')
      setFiles([])
      setFragment(undefined)
      setResult(undefined)
      setCurrentTab('code')
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)

      if (error) throw error

      if (chatId === selectedChatId) {
        handleClearChat()
        setSelectedChatId(undefined)
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  const saveChat = async (messages: Message[]) => {
    if (!session?.user?.id || messages.length === 0) return

    try {
      const lastMessage = messages[messages.length - 1]
      const title = messages[0].content.find(c => c.type === 'text')?.text?.slice(0, 100) || 'Nový chat'

      if (selectedChatId) {
        const { error: chatError } = await supabase
          .from('chats')
          .update({
            title,
            updated_at: new Date().toISOString(),
            last_message: lastMessage.content.find(c => c.type === 'text')?.text,
            model: languageModel.model,
            template: selectedTemplate,
          })
          .eq('id', selectedChatId)

        if (chatError) throw chatError

        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            chat_id: selectedChatId,
            role: lastMessage.role,
            content: lastMessage.content,
            tokens_used: lastMessage.tokens_used,
          })

        if (messageError) throw messageError
      } else {
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .insert({
            user_id: session.user.id,
            title,
            last_message: lastMessage.content.find(c => c.type === 'text')?.text,
            model: languageModel.model,
            template: selectedTemplate,
          })
          .select()
          .single()

        if (chatError) throw chatError

        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            chat_id: chat.id,
            role: lastMessage.role,
            content: lastMessage.content,
            tokens_used: lastMessage.tokens_used,
          })

        if (messageError) throw messageError

        setSelectedChatId(chat.id)
      }
    } catch (error) {
      console.error('Error saving chat:', error)
    }
  }

  useEffect(() => {
    if (messages.length > 0) {
      saveChat(messages)
    }
  }, [messages])

  const handleSubmitAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isLoading) {
      stop()
      return
    }

    const content: Message['content'] = [{ type: 'text', text: chatInput }]
    const images = await toMessageImage(files)

    if (images.length > 0) {
      images.forEach((image) => {
        content.push({ type: 'image', image })
      })
    }

    const newMessage = {
      role: 'user' as const,
      content,
    }

    setMessages(prev => [...prev, newMessage])

    submit({
      userID: session?.user?.id,
      messages: toAISDKMessages([...messages, newMessage]),
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
    })

    setChatInput('')
    setFiles([])
    setCurrentTab('code')

    posthog.capture('chat_submit', {
      template: selectedTemplate,
      model: languageModel.model,
    })
  }

  const handleClearChat = () => {
    stop()
    setChatInput('')
    setFiles([])
    setMessages([])
    setFragment(undefined)
    setResult(undefined)
    setCurrentTab('code')
    setIsPreviewLoading(false)
  }

  const handleUndo = () => {
    setMessages(prev => prev.slice(0, -2))
    setFragment(undefined)
    setResult(undefined)
  }

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-3/4" />
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NavBar
        session={session}
        showLogin={() => setAuthDialog(true)}
        signOut={() => supabase?.auth.signOut()}
        selectedChatId={selectedChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />
      <div className="flex flex-1 overflow-hidden">
        <ChatHistory
          session={session}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          className="hidden md:block w-[300px] lg:w-[350px] border-r"
        />
        <div className="grid w-full md:grid-cols-2 relative">
          <div
            className={cn(
              "flex flex-col w-full max-h-[calc(100vh-4rem)] overflow-hidden transition-all duration-300 ease-in-out",
              fragment 
                ? 'md:col-span-1' 
                : 'col-span-2',
              fragment && 'fixed md:relative w-full h-full md:h-auto inset-0 bg-background md:bg-transparent z-50 md:z-auto'
            )}
          >
            <div className="flex-1 overflow-auto px-4">
              <Chat
                messages={messages}
                isLoading={isLoading}
                onClear={handleClearChat}
                canClear={messages.length > 0}
                onUndo={handleUndo}
                canUndo={messages.length > 1 && !isLoading}
                setCurrentPreview={({ fragment, result }) => {
                  setFragment(fragment)
                  setResult(result)
                  if (window.innerWidth < 768) {
                    setCurrentTab('fragment')
                  }
                }}
              />
            </div>
            <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container max-w-3xl mx-auto px-4">
                <ChatInput
                  retry={() =>
                    submit({
                      userID: session?.user?.id,
                      messages: toAISDKMessages(messages),
                      template: currentTemplate,
                      model: currentModel,
                      config: languageModel,
                    })
                  }
                  isErrored={error !== undefined}
                  isLoading={isLoading}
                  isRateLimited={isRateLimited}
                  stop={stop}
                  input={chatInput}
                  handleInputChange={(e) => setChatInput(e.target.value)}
                  handleSubmit={handleSubmitAuth}
                  isMultiModal={currentModel?.multiModal || false}
                  files={files}
                  handleFileChange={setFiles}
                >
                  <ChatPicker
                    templates={templates}
                    selectedTemplate={selectedTemplate}
                    onSelectedTemplateChange={setSelectedTemplate}
                    models={modelsList.models}
                    languageModel={languageModel}
                    onLanguageModelChange={(e) => setLanguageModel({ ...languageModel, ...e })}
                  />
                  <ChatSettings
                    languageModel={languageModel}
                    onLanguageModelChange={(e) => setLanguageModel({ ...languageModel, ...e })}
                    apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
                    baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
                  />
                </ChatInput>
              </div>
            </div>
          </div>
          {fragment && (
            <div 
              className={cn(
                "hidden md:block transition-opacity duration-300 border-l",
                isPreviewLoading ? "opacity-50" : "opacity-100"
              )}
            >
              <Preview
                apiKey={session?.apiKey}
                selectedTab={currentTab}
                onSelectedTabChange={setCurrentTab}
                isChatLoading={isLoading}
                isPreviewLoading={isPreviewLoading}
                fragment={fragment}
                result={result}
                onClose={() => {
                  setFragment(undefined)
                  setResult(undefined)
                }}
              />
            </div>
          )}
        </div>
      </div>
      <AuthDialog
        open={isAuthDialogOpen}
        setOpen={setAuthDialog}
        view={authView}
        supabase={supabase}
      />
    </div>
  )
}

