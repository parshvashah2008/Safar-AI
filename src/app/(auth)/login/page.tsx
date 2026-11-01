'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('traveler@safar.ai');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/trips');
  };

  return (
    <div className="rounded-3xl border border-ivory-300 bg-white p-8 shadow-card space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-editorial text-2xl sm:text-3xl font-medium tracking-tight text-ink">
          Welcome Back
        </h1>
        <p className="text-xs text-ink-400">
          Enter your credentials to access your trips and wallet.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <Input
              id="email"
              type="email"
              required
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <span className="text-[11px] text-teal-600 hover:underline cursor-pointer">
              Forgot password?
            </span>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <Input
              id="password"
              type="password"
              required
              className="pl-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" className="w-full text-xs gap-1 shadow-sm">
          <span>Sign In to Travel Space</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </form>

      <div className="pt-4 border-t border-ivory-200 text-center text-xs text-ink-400">
        Don’t have an account yet?{' '}
        <Link href="/register" className="font-semibold text-teal-700 hover:underline">
          Create one now
        </Link>
      </div>

      <div className="rounded-xl bg-ivory-100 p-3 text-[11px] text-ink-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-teal-600" />
        <span>Pre-filled with demo credentials for instant testing</span>
      </div>
    </div>
  );
}
