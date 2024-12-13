import { createClient } from '@supabase/supabase-js'
import { Session } from '@supabase/supabase-js'
import { usePostHog } from 'posthog-js/react'
import { useState, useEffect, useRef, useCallback } from 'react'

export type AuthViewType =
  | 'sign_in'
  | 'sign_up'
  | 'magic_link'
  | 'forgotten_password'
  | 'update_password'
  | 'verify_otp'

interface UserTeam {
  id: string
  name: string
  is_default: boolean
  tier: string
  email: string
  team_api_keys: { api_key: string }[]
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getUserAPIKey(session: Session) {
  // If E2B_API_KEY is set in env, use that
  if (process.env.E2B_API_KEY) {
    return process.env.E2B_API_KEY;
  }

  // If no Supabase, return undefined
  if (!supabase) {
    console.warn('Supabase is not initialized');
    return undefined;
  }

  // Try to get API key from user's teams
  const { data: userTeams } = await supabase
    .from('users_teams')
    .select(
      'teams (id, name, is_default, tier, email, team_api_keys (api_key))',
    )
    .eq('user_id', session?.user.id)

  const teams = userTeams
    ?.map((userTeam: any) => userTeam.teams)
    .map((team: UserTeam) => {
      return {
        ...team,
        apiKeys: team.team_api_keys.map((apiKey) => apiKey.api_key),
      }
    })

  const defaultTeam = teams?.find((team) => team.is_default)
  return defaultTeam?.apiKeys[0]
}

export function useAuth(
  setAuthDialog: (value: boolean) => void,
  setAuthView: (value: AuthViewType) => void,
) {
  const [session, setSession] = useState<Session | null>(null)
  const [apiKey, setApiKey] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const posthog = usePostHog()
  const recoveryRef = useRef(false)

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase is not initialized')
      setSession({ user: { email: 'demo@e2b.dev' } } as Session)
      setIsLoading(false)
      return
    }

    const handleAuthStateChange = async (_event: string, session: Session | null) => {
      setSession(session)

      if (_event === 'PASSWORD_RECOVERY') {
        recoveryRef.current = true
        setAuthView('update_password')
        setAuthDialog(true)
      }

      if (_event === 'USER_UPDATED' && recoveryRef.current) {
        recoveryRef.current = false
      }

      if (_event === 'SIGNED_IN' && !recoveryRef.current) {
        setAuthDialog(false)
        if (session) {
          const key = await getUserAPIKey(session)
          setApiKey(key)
          if (!session.user.user_metadata.is_fragments_user) {
            await supabase?.auth.updateUser({
              data: { is_fragments_user: true },
            })
          }
          posthog.identify(session.user.id, {
            email: session.user.email,
            supabase_id: session.user.id,
          })
          posthog.capture('sign_in')
        }
      }

      if (_event === 'SIGNED_OUT') {
        setApiKey(undefined)
        setAuthView('sign_in')
        posthog.capture('sign_out')
        posthog.reset()
      }
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        getUserAPIKey(session).then(setApiKey)
        if (!session.user.user_metadata.is_fragments_user) {
          supabase?.auth.updateUser({
            data: { is_fragments_user: true },
          })
        }
        posthog.identify(session.user.id, {
          email: session.user.email,
          supabase_id: session.user.id,
        })
        posthog.capture('sign_in')
      }
      setIsLoading(false)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    return () => subscription.unsubscribe()
  }, [setAuthDialog, setAuthView, posthog])

  return {
    session,
    apiKey,
    isLoading,
  }
}
