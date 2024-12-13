'use client';

import { NavBar } from '@/components/navbar';
import { SubscriptionCard } from '@/components/subscription-card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const plans = [
  {
    name: 'Basic Plan',
    priceId: 'price_1QUyimBebNyLxWuLZihHJTp8',
    description: '100 fragmentů měsíčně',
    price: 199,
    features: [
      '100 fragmentů měsíčně',
      'Základní podpora',
      'Přístup ke všem funkcím',
    ],
  },
  {
    name: 'Pro Plan',
    priceId: 'price_1QUyirBebNyLxWuLYlP5Yumr',
    description: 'Neomezené fragmenty',
    price: 499,
    features: [
      'Neomezené fragmenty',
      'Prioritní podpora',
      'Přístup ke všem funkcím',
      'Přednostní přístup k novinkám',
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      } else {
        setUserEmail(null);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('user_id', session.user.id)
          .single();

        setCurrentPlan(profile?.subscription_tier || null);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Přihlášení vyžadováno',
          description: 'Pro změnu předplatného se prosím přihlaste.',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: session.user.id,
        }),
      });

      const { url } = await response.json();
      router.push(url);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se vytvořit předplatné.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleShowLogin = () => {
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar 
          session={session}
          showLogin={handleShowLogin}
          signOut={handleSignOut}
          selectedChatId={undefined}
          onSelectChat={() => {}}
          onNewChat={() => {}}
          onDeleteChat={() => {}}
        />
        <div className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">Načítání...</div>
          </div>
        </div>
      </div>
    );
  }

  const currentPlanDetails = plans.find(plan => plan.priceId === currentPlan);

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar 
        session={session}
        showLogin={handleShowLogin}
        signOut={handleSignOut}
        selectedChatId={undefined}
        onSelectChat={() => {}}
        onNewChat={() => {}}
        onDeleteChat={() => {}}
      />
      <div className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Předplatné</h1>
          {userEmail && (
            <div className="mb-4 text-muted-foreground">
              <p>Email: {userEmail}</p>
              <p>Aktuální plán: {currentPlanDetails?.name || 'Free Plan'}</p>
            </div>
          )}
          <p className="text-lg text-muted-foreground">
            Vyberte si plán, který vám nejvíce vyhovuje
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <SubscriptionCard
              key={plan.name}
              name={plan.name}
              description={plan.description}
              price={plan.price}
              features={plan.features}
              isCurrentPlan={currentPlan === plan.priceId}
              onSubscribe={() => handleSubscribe(plan.priceId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 