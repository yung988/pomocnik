'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/auth';
import { useState } from 'react';

interface SubscriptionCardProps {
  name: string;
  description: string;
  price: number;
  features: string[];
  isCurrentPlan?: boolean;
  onSubscribe?: () => Promise<void>;
}

export function SubscriptionCard({
  name,
  description,
  price,
  features,
  isCurrentPlan,
  onSubscribe,
}: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      await onSubscribe?.();
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se provést změnu předplatného.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Přihlášení vyžadováno',
          description: 'Pro správu předplatného se prosím přihlaste.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se otevřít správu předplatného.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[300px]">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">
          {price} Kč<span className="text-sm font-normal">/měsíc</span>
        </div>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={handleSubscribe}
          disabled={isLoading || isCurrentPlan}
          variant={isCurrentPlan ? 'secondary' : 'default'}
        >
          {isCurrentPlan ? 'Aktuální plán' : 'Vybrat plán'}
        </Button>
        {isCurrentPlan && (
          <Button
            className="w-full"
            onClick={handleManageSubscription}
            disabled={isLoading}
            variant="outline"
          >
            Spravovat předplatné
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 