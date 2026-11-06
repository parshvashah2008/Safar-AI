'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

function WalletRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', 'vault');
    router.replace(`/budget?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[#0d5c48] dark:text-emerald-400">
        <CreditCard className="w-6 h-6 animate-pulse" />
      </div>
      <h2 className="font-editorial text-2xl font-medium text-ink dark:text-white">
        Redirecting to Trip Finance Hub…
      </h2>
      <p className="text-xs text-ink-400 dark:text-[#8ca397] max-w-sm">
        Your card vault and daily spending limits have been unified into the all-in-one Financial Guardian.
      </p>
      <Link href="/budget?tab=vault">
        <Button size="sm" className="bg-[#0d5c48] hover:bg-[#094032] text-white rounded-xl gap-2 text-xs">
          Open Spending Vault <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-ink-500 font-mono">Redirecting to Trip Finance...</div>}>
      <WalletRedirect />
    </Suspense>
  );
}
