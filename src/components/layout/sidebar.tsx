'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  FileText,
  Globe2,
  IndianRupee,
  MapPin,
  Plane,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Button } from '@/components/ui/button';
import { useActiveSearch } from '@/lib/services/sync-bus';

export const navItems = [
  { href: '/trips', label: 'My Trips', icon: Plane },
  { href: '/plan', label: 'AI Planner', icon: Sparkles, badge: 'AI' },
  { href: '/copilot', label: 'SAFAR Copilot', icon: Compass },
  { href: '/explore', label: 'Explore Destinations', icon: Globe2 },
  { href: '/budget', label: 'Budget Guardian', icon: IndianRupee },
  { href: '/wallet', label: 'Trip Wallet', icon: Wallet },
  { href: '/bookings', label: 'Bookings & Passes', icon: FileText },
  { href: '/translate', label: 'Global Translator', icon: MapPin },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeSearch } = useActiveSearch();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#e8e6df] dark:border-[#1e2e26] bg-[#ffffff]/90 dark:bg-[#121c17]/90 backdrop-blur-xl lg:flex transition-colors">
      {/* Brand Header */}
      <div className="flex h-20 items-center px-6 border-b border-[#f0eee9] dark:border-[#1e2e26]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#094032] via-[#0d5c48] to-[#12795f] text-white shadow-md shadow-emerald-950/10 transition-transform group-hover:scale-105 border border-[#dfb981]/25">
            <Plane className="h-5 w-5 text-emerald-100" />
          </div>
          <div className="flex flex-col">
            <span className="font-editorial text-2xl font-semibold tracking-tight text-[#111a16] dark:text-[#edf2ee] flex items-center gap-1.5">
              SAFAR <span className="font-sans text-xs font-bold text-[#0d5c48] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40 tracking-wider">AI</span>
            </span>
            <span className="font-mono text-[9px] tracking-widest text-[#5f7067] dark:text-[#8ca397] uppercase font-medium">
              Global Bespoke Journeys
            </span>
          </div>
        </Link>
      </div>

      <div className="px-6 pt-4 pb-1">
        <span className="font-mono text-[9px] tracking-widest uppercase text-[#88968f] dark:text-[#6a7d73] font-semibold">
          Your Workspace
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-[#094032] to-[#0d5c48] text-white shadow-sm shadow-emerald-950/15 font-semibold border border-[#dfb981]/25'
                  : 'text-[#405048] hover:bg-[#f4f3ee] hover:text-[#111a16] dark:text-[#8ca397] dark:hover:bg-[#18251f] dark:hover:text-[#edf2ee]'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-emerald-200' : 'text-[#6c7d74] dark:text-[#8ca397] group-hover:text-[#0d5c48] dark:group-hover:text-emerald-400'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase',
                    isActive
                      ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0d5c48] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Active Synchronized Journey Card */}
      {activeSearch.destination && (
        <div className="mx-3 my-2 p-3 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/70 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#0d5c48] dark:text-emerald-400 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Journey</span>
          </div>
          <div className="font-semibold text-xs text-[#111a16] dark:text-[#edf2ee] mt-0.5 truncate" title={activeSearch.destination}>
            {activeSearch.destination}
          </div>
          <div className="text-[11px] text-[#5f7067] dark:text-[#8ca397] font-mono mt-0.5">
            ₹{activeSearch.budget.toLocaleString()} · {activeSearch.travelers} pax
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Link
              href={`/plan?destination=${encodeURIComponent(activeSearch.destination)}&travelers=${activeSearch.travelers}&budget=${activeSearch.budget}`}
              className="flex-1"
            >
              <Button size="sm" className="w-full h-6 text-[10px] bg-[#0d5c48] hover:bg-[#094032] text-white rounded-lg p-0 font-medium">
                Plan
              </Button>
            </Link>
            <Link
              href={`/explore?destination=${encodeURIComponent(activeSearch.destination)}`}
              className="flex-1"
            >
              <Button size="sm" variant="outline" className="w-full h-6 text-[10px] border-emerald-300 dark:border-emerald-800 rounded-lg p-0 font-medium text-[#0d5c48] dark:text-emerald-300">
                Explore
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Theme Switch Control */}
      <div className="px-4 py-3 border-t border-[#f0eee9] dark:border-[#1e2e26] flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-wider text-[#6c7d74] dark:text-[#8ca397] uppercase">
          Theme
        </span>
        <ThemeToggle showLabel={true} />
      </div>
    </aside>
  );
}
