import Logo from './logo'
import { AuthViewType } from '@/lib/auth'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { SupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'

function AuthForm({
  supabase,
  view = 'sign_in',
}: {
  supabase: SupabaseClient
  view: AuthViewType
}) {
  return (
    <div className="flex justify-center items-center flex-col">
      <h1 className="flex items-center gap-4 text-xl font-bold mb-2 w-full">
        <div className="flex items-center justify-center rounded-md shadow-md bg-black p-2">
          <Logo className="text-white w-6 h-6" />
        </div>
        Pomocník
      </h1>
      <div className="w-full">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#E447B8',
                  brandAccent: '#E447B8',
                  inputText: 'hsl(var(--foreground))',
                  dividerBackground: 'hsl(var(--border))',
                  inputBorder: 'hsl(var(--input))',
                  inputBorderFocus: 'hsl(var(--ring))',
                  inputBorderHover: 'hsl(var(--input))',
                  inputLabelText: 'hsl(var(--muted-foreground))',
                  defaultButtonText: 'hsl(var(--primary))',
                  defaultButtonBackground: 'hsl(var(--secondary))',
                  defaultButtonBackgroundHover: 'hsl(var(--secondary))',
                  defaultButtonBorder: 'hsl(var(--secondary))',
                },
                radii: {
                  borderRadiusButton: '0.7rem',
                  inputBorderRadius: '0.7rem',
                },
              },
            },
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Heslo',
                button_label: 'Přihlásit se',
                social_provider_text: 'Pokračovat přes',
                email_input_placeholder: 'Váš email',
                password_input_placeholder: 'Vaše heslo',
                link_text: 'Nemáte účet? Zaregistrujte se',
              },
              forgotten_password: {
                email_label: 'Email',
                button_label: 'Obnovit heslo',
                link_text: 'Zapomněli jste heslo?',
              },
            },
          }}
          view={view}
          theme="default"
          showLinks={true}
          providers={['github']}
          providerScopes={{
            github: 'user:email'
          }}
        />
        <div className="mt-4 text-center">
          <Link 
            href="/register" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Nemáte účet? Zaregistrujte se
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AuthForm
