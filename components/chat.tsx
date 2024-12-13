import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { Loader2Icon, LoaderIcon, Terminal, Trash, Undo } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

interface ChatProps {
  messages: Message[]
  isLoading: boolean
  onClear?: () => void
  canClear?: boolean
  onUndo?: () => void
  canUndo?: boolean
  setCurrentPreview: (preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) => void
}

export function Chat({
  messages,
  isLoading,
  onClear,
  canClear,
  onUndo,
  canUndo,
  setCurrentPreview,
}: ChatProps) {
  // Extract messages string to separate variable for dependency array
  const messagesString = useMemo(() => JSON.stringify(messages), [messages])

  useEffect(() => {
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messagesString])

  return (
    <div className="relative flex flex-col h-full">
      {/* Action buttons */}
      {(canClear || canUndo) && (
        <div className="sticky top-0 z-10 flex justify-end gap-2 p-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {canUndo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              className="h-8 px-2"
            >
              <Undo className="h-4 w-4 mr-1" />
              Zpět
            </Button>
          )}
          {canClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8 px-2"
            >
              <Trash className="h-4 w-4 mr-1" />
              Vyčistit
            </Button>
          )}
        </div>
      )}

      {/* Chat messages */}
      <div
        id="chat-container"
        className="flex flex-col pb-4 sm:pb-6 gap-2 sm:gap-3 overflow-y-auto max-h-full"
      >
        {messages.map((message: Message, index: number) => (
          <div
            className={cn(
              `flex flex-col px-3 sm:px-4 shadow-sm whitespace-pre-wrap`,
              message.role !== 'user' 
                ? 'bg-accent dark:bg-white/5 border text-accent-foreground dark:text-muted-foreground py-3 sm:py-4 rounded-xl sm:rounded-2xl gap-3 sm:gap-4 w-full max-w-[calc(100%-2rem)]' 
                : 'bg-gradient-to-b from-black/5 to-black/10 dark:from-black/30 dark:to-black/50 py-2 sm:py-3 rounded-lg sm:rounded-xl gap-2 w-fit max-w-[85%] sm:max-w-[75%]'
            )}
            key={index}
          >
            {message.content.map((content, id) => {
              if (content.type === 'text') {
                return content.text
              }
              if (content.type === 'image') {
                return (
                  <Image
                    key={id}
                    src={content.image}
                    alt="fragment"
                    width={48}
                    height={48}
                    className="mr-2 inline-block w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg bg-white mb-2"
                  />
                )
              }
            })}
            {message.object && (
              <div
                onClick={() =>
                  setCurrentPreview({
                    fragment: message.object,
                    result: message.result,
                  })
                }
                className="py-2 pl-2 w-full sm:w-max flex items-center border rounded-lg sm:rounded-xl select-none hover:bg-white/50 dark:hover:bg-white/5 hover:cursor-pointer transition-colors"
              >
                <div className="rounded-[0.5rem] w-8 h-8 sm:w-10 sm:h-10 bg-black/5 dark:bg-white/5 self-stretch flex items-center justify-center">
                  <Terminal strokeWidth={2} className="text-[#FF8800] w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="pl-2 pr-3 sm:pr-4 flex flex-col">
                  <span className="font-bold font-sans text-xs sm:text-sm text-primary">
                    {message.object.title}
                  </span>
                  <span className="font-sans text-xs sm:text-sm text-muted-foreground">
                    Klikněte pro zobrazení fragmentu
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground px-3 sm:px-4">
            <LoaderIcon strokeWidth={2} className="animate-spin w-3 h-3 sm:w-4 sm:h-4" />
            <span>Generuji...</span>
          </div>
        )}
      </div>
    </div>
  )
}
