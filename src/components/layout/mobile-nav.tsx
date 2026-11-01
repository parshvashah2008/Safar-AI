'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plane, ShieldCheck, X } from 'lucide-react';
import { navItems } from '@/components/layout/sidebar';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] flex flex-col bg-white p-6 shadow-elevated dark:bg-ink-900 border-r border-ivory-300 dark:border-ink-800 animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between pb-6 border-b border-ivory-300 dark:border-ink-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Plane className="h-4 w-4" />
            </div>
            <span className="font-editorial text-lg font-medium text-ink dark:text-ivory-100">
              SAFAR <span className="text-teal-600 font-sans text-xs font-semibold">AI</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ivory-200 dark:hover:bg-ink-800"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-ink-500 hover:bg-ivory-200/60 dark:text-ink-300 dark:hover:bg-ink-800'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-sand-100 px-2 py-0.5 font-mono text-[9px] font-semibold text-sand-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-ivory-300 dark:border-ink-800">
          <div className="flex items-center gap-2 text-teal-700 text-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>Encrypted local travel vault</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
