'use client';

import { useTheme } from '@/components/theme-provider';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ThemeSwitchProps {
  showLabel?: boolean;
  className?: string;
  variant?: 'switch' | 'icon';
}

export function ThemeToggle({ showLabel = false, className, variant = 'switch' }: ThemeSwitchProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';

  if (variant === 'icon') {
    return (
      <button
        type="button"
        aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={cn(
          'relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#dcd9d0] dark:border-[#22352b] bg-white/80 dark:bg-[#15221b] text-[#111a16] dark:text-[#edf2ee] hover:bg-emerald-50/70 dark:hover:bg-[#1c2e24] hover:text-[#0d5c48] dark:hover:text-emerald-300 transition-colors shadow-2xs',
          className
        )}
      >
        {isDark ? (
          <Moon className="h-4 w-4 fill-emerald-400/20 text-emerald-300" />
        ) : (
          <Sun className="h-4 w-4 fill-amber-400/20 text-amber-500" />
        )}
      </button>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {showLabel && (
        <span className="text-xs font-medium text-[#6c7d74] dark:text-[#8ca397] select-none">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
      
      {/* Tactile Sliding Switch Button with High-Contrast Sun & Moon */}
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={cn(
          'relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 select-none shadow-xs',
          isDark
            ? 'bg-[#0f1914] border border-[#203629]'
            : 'bg-[#e7e4d8] border border-[#d0ccbc]'
        )}
      >
        {/* Track Icons: Left Sun, Right Moon */}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 text-[10px]">
          <Sun
            className={cn(
              'h-3.5 w-3.5 transition-opacity duration-200',
              isDark ? 'opacity-80 text-amber-400' : 'opacity-0'
            )}
          />
          <Moon
            className={cn(
              'h-3.5 w-3.5 transition-opacity duration-200',
              isDark ? 'opacity-0' : 'opacity-70 text-[#52645b]'
            )}
          />
        </span>

        {/* Sliding Thumb Knob */}
        <span
          className={cn(
            'pointer-events-none relative flex h-6 w-6 transform items-center justify-center rounded-full transition-transform duration-300 ease-spring shadow-sm',
            isDark
              ? 'translate-x-6 bg-[#1a2d22] text-emerald-300 border border-emerald-500/50 shadow-emerald-950/60'
              : 'translate-x-0 bg-white text-amber-500 border border-[#dfdbcc] shadow-neutral-400/30'
          )}
        >
          {isDark ? (
            <Moon className="h-3.5 w-3.5 fill-emerald-400/30 text-emerald-300" />
          ) : (
            <Sun className="h-3.5 w-3.5 fill-amber-400/30 text-amber-500" />
          )}
        </span>
      </button>
    </div>
  );
}

/**
 * Segmented switch component for Settings or prominent display
 */
export function ThemeSegmentedSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';

  return (
    <div
      className={cn(
        'inline-flex p-1 rounded-2xl border border-[#e2dfd5] dark:border-[#22352b] bg-[#f5f4ee] dark:bg-[#0c1410] shadow-inner',
        className
      )}
      role="radiogroup"
      aria-label="Theme Selection"
    >
      <button
        type="button"
        role="radio"
        aria-checked={!isDark}
        onClick={() => setTheme('light')}
        className={cn(
          'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer',
          !isDark
            ? 'bg-white text-[#111a16] shadow-sm border border-[#e2dfd5]'
            : 'text-[#6c7d74] hover:text-[#111a16] dark:text-[#8ca397] dark:hover:text-white'
        )}
      >
        <Sun className={cn('h-4 w-4', !isDark ? 'text-amber-500 fill-amber-500/20' : 'text-slate-400')} />
        <span>Light Mode</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={isDark}
        onClick={() => setTheme('dark')}
        className={cn(
          'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer',
          isDark
            ? 'bg-[#182820] text-emerald-200 shadow-sm border border-emerald-500/40 shadow-emerald-950/40'
            : 'text-[#6c7d74] hover:text-[#111a16] dark:text-[#8ca397] dark:hover:text-white'
        )}
      >
        <Moon className={cn('h-4 w-4', isDark ? 'text-emerald-400 fill-emerald-400/20' : 'text-slate-400')} />
        <span>Dark Mode</span>
      </button>
    </div>
  );
}
