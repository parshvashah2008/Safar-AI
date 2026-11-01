'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('Parshva Traveler');
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
          Start Your Journey
        </h1>
        <p className="text-xs text-ink-400">
          Create your private personal travel workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <Input
              id="name"
              type="text"
              required
              className="pl-9"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

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
          <Label htmlFor="password">Password</Label>
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
          <span>Create Travel Account</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </form>

      <div className="pt-4 border-t border-ivory-200 text-center text-xs text-ink-400">
        Already have a Safar account?{' '}
        <Link href="/login" className="font-semibold text-teal-700 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
