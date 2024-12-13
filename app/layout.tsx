"use client"

import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from './providers'
import { Loading } from '@/components/loading'
import { useEffect, useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <html lang="cs" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-background flex items-center justify-center">
            {isLoading ? (
              <div className="w-full">
                <Loading />
              </div>
            ) : (
              <main className="flex flex-col min-h-screen w-full">
                {children}
              </main>
            )}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
