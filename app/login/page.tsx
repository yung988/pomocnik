'use client'

import { useEffect, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/auth'
import Logo from '@/components/logo'

export default function LoginPage() {
  const [redirectUrl, setRedirectUrl] = useState<string>('')

  useEffect(() => {
    setRedirectUrl(`${window.location.origin}/chat`)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-[400px] p-8 bg-card rounded-lg border border-border shadow-sm">
        <Auth
          supabaseClient={supabase}
          view="sign_in"
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#0F172A',
                  brandAccent: '#1E293B',
                  inputBackground: 'transparent',
                  inputBorder: '#E2E8F0',
                  inputText: 'inherit',
                  inputLabelText: 'inherit',
                }
              }
            },
            className: {
              button: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow transition-colors',
              input: 'bg-background border border-input',
              label: 'text-foreground',
              loader: 'text-primary',
              anchor: 'text-primary hover:text-primary/90 font-medium',
            }
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Password',
                button_label: 'Sign in',
                social_provider_text: 'Continue with',
                link_text: "Don't have an account? Register",
              },
            },
          }}
          providers={['google', 'github']}
          redirectTo={redirectUrl}
        />
      </div>
    </div>
  )
}

