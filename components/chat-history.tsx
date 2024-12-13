"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Message } from "@/lib/messages"
import { Archive, Menu, MessageSquare, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/auth"
import { Session } from "@supabase/supabase-js"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { cs } from "date-fns/locale"

interface Chat {
  id: string
  title: string
  created_at: string
  updated_at: string
  is_archived: boolean
  messages: Message[]
  model: string
  template: string
}

interface ChatHistoryProps {
  session: Session | null
  selectedChatId?: string
  onSelectChat: (chat: Chat) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
  className?: string
}

export function ChatHistory({
  session,
  selectedChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  className
}: ChatHistoryProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchChats = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .eq('is_archived', showArchived)
          .order('updated_at', { ascending: false })

        if (error) throw error
        setChats(data || [])
      } catch (error) {
        console.error('Error fetching chats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChats()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('chat_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          fetchChats()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [session?.user?.id, showArchived])

  const handleArchiveChat = async (chatId: string, archive: boolean) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ is_archived: archive })
        .eq('id', chatId)

      if (error) throw error
    } catch (error) {
      console.error('Error archiving chat:', error)
    }
  }

  const filteredChats = chats.filter(chat => 
    chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.messages.some(msg => 
      msg.content.some(content => 
        content.type === 'text' && content.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  )

  const ChatList = () => (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-2">
        <div className="sticky top-0 space-y-2 mb-4 bg-background/80 backdrop-blur-sm p-2 -mx-2">
          <Input
            placeholder="Hledat v chatech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-4 w-4" />
            {showArchived ? "Zobrazit aktivní" : "Zobrazit archivované"}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-muted/50 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {searchQuery 
                ? "Žádné výsledky" 
                : showArchived 
                  ? "Žádné archivované chaty"
                  : "Žádné chaty"}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                onSelectChat(chat)
                setIsOpen(false)
              }}
              className={cn(
                "w-full text-left p-3 text-sm rounded-lg hover:bg-accent group relative",
                selectedChatId === chat.id && "bg-accent"
              )}
            >
              <div className="font-medium truncate mb-1">
                {chat.title || "Nový chat"}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  {format(new Date(chat.updated_at), "d. MMMM yyyy", { locale: cs })}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleArchiveChat(chat.id, !chat.is_archived)
                    }}
                  >
                    <Archive className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteChat(chat.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </ScrollArea>
  )

  // Desktop view
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return (
      <div className={cn("w-64 border-r bg-muted/10 hidden md:flex flex-col h-full", className)}>
        <div className="p-2 border-b bg-background">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={onNewChat}
          >
            <Plus className="h-4 w-4" />
            Nový chat
          </Button>
        </div>
        <ChatList />
      </div>
    )
  }

  // Mobile view
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full shadow-lg md:hidden bg-primary text-primary-foreground hover:bg-primary/90 z-50"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0">
          <DialogHeader className="p-2 border-b bg-background">
            <DialogTitle asChild>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => {
                  onNewChat()
                  setIsOpen(false)
                }}
              >
                <Plus className="h-4 w-4" />
                Nový chat
              </Button>
            </DialogTitle>
          </DialogHeader>
          <ChatList />
        </DialogContent>
      </Dialog>
    </>
  )
} 