'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Menu, Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navItems } from '@/components/layout/sidebar';
import { NotificationPopover } from '@/components/layout/notification-popover';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useActiveSearch } from '@/lib/services/sync-bus';

interface TopbarProps {
  onOpenMobileNav: () => void;
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const pathname = usePathname();
  const { activeSearch } = useActiveSearch();
  const currentItem = navItems.find((item) => item.href === pathname || (item.href !== '/' && pathname.startsWith(item.href)));
  const pageTitle = currentItem ? currentItem.label : 'Journey View';

  return (
    <header className="sticky top-0 z-20 flex h-20 w-full items-center justify-between border-b border-[#e8e6df] dark:border-[#1e2e26] bg-[#ffffff]/85 dark:bg-[#121c17]/85 px-4 backdrop-blur-xl sm:px-8 transition-colors">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileNav}
          className="lg:hidden text-[#405048] hover:text-[#111a16] dark:text-[#8ca397] dark:hover:text-white"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 text-xs">
          <Link href="/" className="font-medium text-[#6c7d74] hover:text-[#0d5c48] dark:text-[#8ca397] dark:hover:text-emerald-400 transition-colors">
            Safar AI
          </Link>
          <span className="text-[#c5c2b8] dark:text-[#33463c]">/</span>
          <span className="font-semibold text-[#111a16] dark:text-[#edf2ee] font-sans">{pageTitle}</span>

          {activeSearch.destination && (
            <Link
              href={`/plan?destination=${encodeURIComponent(activeSearch.destination)}&travelers=${activeSearch.travelers}&budget=${activeSearch.budget}`}
              className="ml-2 hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0d5c48] dark:text-emerald-300 font-semibold text-[11px] hover:bg-emerald-100 transition-colors shadow-2xs"
              title="Click to view or plan this journey"
            >
              <MapPin className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
              <span>{activeSearch.destination}</span>
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <Link
          href={
            activeSearch.destination
              ? `/plan?destination=${encodeURIComponent(activeSearch.destination)}&travelers=${activeSearch.travelers}&budget=${activeSearch.budget}`
              : '/plan'
          }
          className="shrink-0"
        >
          <Button
            size="sm"
            className="hidden sm:inline-flex gap-1.5 bg-gradient-to-r from-[#094032] to-[#0d5c48] hover:from-[#063327] hover:to-[#094738] text-white shadow-sm shadow-emerald-950/20 text-xs font-semibold px-3.5 h-9 rounded-xl transition-all border border-[#dfb981]/25"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
            <span>Plan Journey</span>
          </Button>
        </Link>

        <Link
          href={
            activeSearch.destination
              ? `/copilot?destination=${encodeURIComponent(activeSearch.destination)}`
              : '/copilot'
          }
          className="shrink-0"
        >
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex text-xs h-9 rounded-xl border-[#dcd9d0] dark:border-[#1e2e26] hover:border-[#0d5c48] dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-[#18251f] text-[#33423a] dark:text-[#edf2ee] gap-1.5"
          >
            <Compass className="h-3.5 w-3.5 text-[#0d5c48] dark:text-emerald-400" />
            <span>Ask Copilot</span>
          </Button>
        </Link>

        {/* Theme Switch Icon Button (Dark / Light Mode) */}
        <div className="flex items-center shrink-0">
          <ThemeToggle variant="icon" />
        </div>

        {/* Interactive Notification Popover */}
        <div className="flex items-center shrink-0">
          <NotificationPopover />
        </div>

        <Link href="/settings" title="Settings & API Credentials" className="shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/60 dark:to-amber-800/80 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/60 font-sans text-xs font-bold hover:ring-2 hover:ring-emerald-600/40 transition-all shadow-2xs">
            P
          </div>
        </Link>
      </div>
    </header>
  );
}
