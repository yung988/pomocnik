'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/auth'
import { NavBar } from '@/components/navbar'
import { useToast } from '@/components/ui/use-toast'
import { AuthViewType } from '@/lib/auth'

export default function SettingsPage() {
  const router = useRouter()
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<AuthViewType>('sign_in')
  const { session, isLoading } = useAuth(setAuthDialog, setAuthView)
  const { toast } = useToast()
  const [profile, setProfile] = useState({
    full_name: '',
    subscription_tier: '',
    subscription_status: '',
    fragments_used: 0,
  })

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (data) {
        setProfile(data)
      }
    }

    loadProfile()
  }, [session])

  // Redirect if not authenticated
  if (!isLoading && !session) {
    router.push('/')
    return null
  }

  const handleUpdateProfile = async () => {
    if (!session?.user?.id) return

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
      })
      .eq('user_id', session.user.id)

    if (error) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se aktualizovat profil.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Úspěch',
        description: 'Profil byl aktualizován.',
      })
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session?.user?.id,
        }),
      })

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se otevřít správu předplatného.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavBar
          session={session}
          showLogin={() => setAuthDialog(true)}
          signOut={() => supabase.auth.signOut()}
          selectedChatId={undefined}
          onSelectChat={() => {}}
          onNewChat={() => {}}
          onDeleteChat={() => {}}
        />
        <div className="container py-12">
          <div className="text-center">Načítání...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <NavBar
        session={session}
        showLogin={() => setAuthDialog(true)}
        signOut={() => supabase.auth.signOut()}
        selectedChatId={undefined}
        onSelectChat={() => {}}
        onNewChat={() => {}}
        onDeleteChat={() => {}}
      />
      <div className="container py-12">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Nastavení</h2>
            <p className="text-muted-foreground">
              Spravujte svůj účet a předplatné
            </p>
          </div>
          <Separator />
          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="subscription">Předplatné</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profil</CardTitle>
                  <CardDescription>
                    Upravte své osobní údaje
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={session?.user?.email || ''}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Jméno</Label>
                    <Input
                      id="name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleUpdateProfile}>
                    Uložit změny
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Předplatné</CardTitle>
                  <CardDescription>
                    Spravujte své předplatné a využití
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Aktuální plán</Label>
                    <p className="text-lg font-medium">
                      {profile.subscription_tier === 'pro' ? 'Pro Plan' : 'Basic Plan'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <p className="text-lg font-medium">
                      {profile.subscription_status === 'active' ? 'Aktivní' : 'Neaktivní'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Využití v tomto měsíci</Label>
                    <p className="text-lg font-medium">
                      {profile.fragments_used} fragmentů
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleManageSubscription}>
                    Spravovat předplatné
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 