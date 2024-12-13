import Logo from './logo'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Session } from '@supabase/supabase-js'
import { Menu, LogOut, Settings, Plus } from 'lucide-react'
import Link from 'next/link'
import { ChatHistory } from './chat-history'
import { Message } from '@/lib/messages'

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

interface NavBarProps {
  session: Session | null
  showLogin: () => void
  signOut: () => void
  selectedChatId?: string
  onSelectChat: (chat: Chat) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
}

export function NavBar({
  session,
  showLogin,
  signOut,
  selectedChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}: NavBarProps) {
  return (
    <div className="flex h-16 w-full shrink-0 items-center border-b bg-background px-4">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 pt-16">
          <SheetHeader className="px-4 pb-4">
            <SheetTitle>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={onNewChat}
              >
                <Plus className="h-4 w-4" />
                Nový chat
              </Button>
            </SheetTitle>
          </SheetHeader>
          <ChatHistory
            session={session}
            selectedChatId={selectedChatId}
            onSelectChat={onSelectChat}
            onNewChat={onNewChat}
            onDeleteChat={onDeleteChat}
            className="border-none"
          />
        </SheetContent>
      </Sheet>

      {/* Logo */}
      <div className="flex items-center gap-2 md:ml-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo width={32} height={32} />
          <span className="font-semibold hidden md:inline-block">Pomocník</span>
        </Link>
      </div>

      {/* Desktop New Chat Button */}
      <Button
        variant="ghost"
        className="hidden md:flex items-center gap-2 ml-4"
        onClick={onNewChat}
      >
        <Plus className="h-4 w-4" />
        Nový chat
      </Button>

      {/* Right Side */}
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={
                      session.user.user_metadata?.avatar_url ||
                      'https://avatar.vercel.sh/' + session.user.email
                    }
                    alt={session.user.email}
                  />
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm font-medium">Můj účet</span>
                <span className="text-xs text-muted-foreground">
                  {session.user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/settings">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Nastavení
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Odhlásit se
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="default" onClick={showLogin}>
            Přihlásit se
          </Button>
        )}
      </div>
    </div>
  )
}
