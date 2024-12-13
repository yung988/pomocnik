"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Message } from "@/lib/messages"
import { Archive, Menu, MessageSquare, Plus, Search, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
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
  last_message: string | null
  model: string | null
  template: string | null
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
  className,
}: ChatHistoryProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const loadChats = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      const { data: chats, error } = await supabase
        .from("chats")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_archived", showArchived)
        .order("updated_at", { ascending: false })

      if (error) throw error

      setChats(chats || [])
    } catch (error) {
      console.error("Error loading chats:", error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, showArchived])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.last_message && chat.last_message.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center gap-2 p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nový chat
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Načítám...</div>
          ) : filteredChats.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {searchQuery
                ? "Žádné chaty neodpovídají vašemu hledání"
                : showArchived
                ? "Žádné archivované chaty"
                : "Žádné chaty"}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 cursor-pointer group",
                  selectedChatId === chat.id && "bg-accent"
                )}
                onClick={() => onSelectChat(chat)}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 truncate">
                  <div className="font-medium truncate">{chat.title}</div>
                  {chat.last_message && (
                    <div className="text-xs text-muted-foreground truncate">
                      {chat.last_message}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(chat.updated_at), "d. MMMM yyyy", {
                      locale: cs,
                    })}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteChat(chat.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hledat chaty</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Zadejte hledaný výraz..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 