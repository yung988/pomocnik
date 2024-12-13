'use client'

import { useState, useEffect } from 'react'
import Logo from '@/components/logo'
import { Button } from '@/components/ui/button'
import { AuthViewType, useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'

export default function HomePage() {
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<AuthViewType>('sign_in')
  const { session } = useAuth(setAuthDialog, setAuthView)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && session) {
      router.push('/chat')
    }
  }, [session, router, mounted])

  if (!mounted) return null

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-background to-muted/30 dark:from-background dark:to-muted/10">
      {/* Levá sekce */}
      <motion.div 
        className="flex-1 p-6 md:p-8 lg:p-12 flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-12 md:mb-24">
          <div className="flex items-center gap-2">
            <Logo className="text-foreground w-8 h-8" />
            <span className="font-bold text-xl">Pomocník</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Přepnout téma"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </Button>
        </div>
        
        <div className="max-w-2xl mx-auto lg:mx-0">
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Vytvořte cokoliv
            <br />
            pomocí AI
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Pomocník je váš osobní AI asistent pro tvorbu kódu, textů a řešení problémů.
            Stačí napsat, co potřebujete.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link href="/register" passHref>
              <Button
                size="lg"
                className="text-lg px-8 bg-primary hover:bg-primary/90 transition-colors duration-200"
              >
                Začít zdarma
              </Button>
            </Link>
            <Link href="/pricing" passHref>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 w-full sm:w-auto hover:bg-muted/50 transition-colors duration-200"
              >
                Zobrazit ceník
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Pravá sekce */}
      <motion.div 
        className="w-full lg:w-[500px] xl:w-[600px] p-6 md:p-8 lg:p-12 flex flex-col items-center justify-center bg-card"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="w-full max-w-sm space-y-6">
          <h2 className="text-2xl font-semibold text-center mb-8">
            Přihlaste se
          </h2>
          <Link href="/login" passHref>
            <Button
              variant="outline"
              size="lg"
              className="w-full hover:bg-muted/50 transition-colors duration-200"
            >
              Přihlásit se
            </Button>
          </Link>
          <Link href="/register" passHref>
            <Button
              variant="default"
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200"
            >
              Vytvořit účet
            </Button>
          </Link>
          <p className="text-center text-sm text-muted-foreground">
            Vyzkoušejte Pomocníka zdarma
          </p>
        </div>
      </motion.div>
    </div>
  )
}

