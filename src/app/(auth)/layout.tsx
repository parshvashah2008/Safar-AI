import Link from 'next/link';
import { Plane } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--safar-bg)] flex flex-col justify-between py-12 px-6">
      <div className="flex justify-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm transition-transform group-hover:scale-105">
            <Plane className="h-5 w-5" />
          </div>
          <span className="font-editorial text-2xl font-semibold tracking-tight text-ink">
            SAFAR <span className="font-sans text-xs font-bold text-teal-600">AI</span>
          </span>
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto my-auto">
        {children}
      </div>

      <div className="text-center text-xs text-ink-400 font-mono">
        SAFAR AI · Your world. Your budget. Your journey.
      </div>
    </div>
  );
}
