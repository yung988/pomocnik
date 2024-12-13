import React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ImageIcon, Loader2, SendIcon, Square, UndoIcon } from 'lucide-react'

interface ChatInputProps {
  retry: () => void
  isErrored: boolean
  isLoading: boolean
  isRateLimited: boolean
  stop: () => void
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isMultiModal: boolean
  files: File[]
  handleFileChange: (files: File[]) => void
  children?: React.ReactNode
}

export function ChatInput({
  retry,
  isErrored,
  isLoading,
  isRateLimited,
  stop,
  input,
  handleInputChange,
  handleSubmit,
  isMultiModal,
  files,
  handleFileChange,
  children,
}: ChatInputProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileChange(Array.from(e.target.files))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center">
        <Textarea
          tabIndex={0}
          rows={1}
          value={input}
          onChange={handleInputChange}
          placeholder="Napište zprávu..."
          spellCheck={false}
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          disabled={isLoading || isRateLimited}
        />
        <div className="absolute right-0 top-4 sm:right-4">
          <div className="flex gap-2">
            {isMultiModal && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isRateLimited}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            )}
            {isErrored ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={retry}
                disabled={isRateLimited}
              >
                <UndoIcon className="h-4 w-4" />
              </Button>
            ) : isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={stop}
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={!input && files.length === 0}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendIcon className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        multiple
      />
      {children}
    </form>
  )
}
