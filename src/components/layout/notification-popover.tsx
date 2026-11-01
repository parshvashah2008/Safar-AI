'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Compass,
  FileCheck2,
  Hotel,
  IndianRupee,
  MapPin,
  Plane,
  Sparkles,
  Train,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface NotificationItem {
  id: string;
  category: 'booking' | 'budget' | 'weather' | 'ai' | 'geo';
  title: string;
  description: string;
  time: string;
  unread: boolean;
  link?: string;
  linkText?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'booking',
    title: 'IRCTC Train Booking Confirmed',
    description: 'Vande Bharat Express (#20977) to Jaipur confirmed. Coach C3, Seats 42 & 43.',
    time: '11:48 AM',
    unread: true,
    link: '/bookings',
    linkText: 'View Pass',
  },
  {
    id: 'notif-2',
    category: 'budget',
    title: 'Budget Guardian: Velocity Healthy',
    description: 'Jaipur trip spend is at ₹19,050 of ₹45,000 (42%). Safe margin remaining.',
    time: '11:15 AM',
    unread: true,
    link: '/budget',
    linkText: 'Check Ledger',
  },
  {
    id: 'notif-3',
    category: 'ai',
    title: 'Copilot Culinary Discovery',
    description: 'Fresh local recommendation: Try Rawat Mishtan Bhandar for Pyaz Kachori before 10:00 AM.',
    time: '10:00 AM',
    unread: true,
    link: '/copilot',
    linkText: 'Ask Copilot',
  },
  {
    id: 'notif-4',
    category: 'geo',
    title: 'Geospatial GPS Route Ready',
    description: 'Turn-by-turn waypoint map generated with relative km distances between 4 stops.',
    time: '08:00 AM',
    unread: false,
    link: '/trips',
    linkText: 'Open Map',
  },
  {
    id: 'notif-5',
    category: 'weather',
    title: 'Pleasant Weather Ahead',
    description: 'Jaipur: Clear skies, pleasant breeze, 28°C high. Perfect for Amber Fort walking tour.',
    time: '06:00 AM',
    unread: false,
  },
];

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Load notifications from local storage if modified
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('safar_notifications');
        if (stored) {
          setNotifications(JSON.parse(stored));
        }
      } catch {}
    }
  }, []);

  // Save changes
  const saveNotifications = (items: NotificationItem[]) => {
    setNotifications(items);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('safar_notifications', JSON.stringify(items));
      } catch {}
    }
  };

  // Click outside to dismiss
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, unread: false }));
    saveNotifications(updated);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, unread: false } : n));
    saveNotifications(updated);
  };

  const removeNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  const getCategoryIcon = (category: NotificationItem['category']) => {
    switch (category) {
      case 'booking':
        return <Train className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'budget':
        return <IndianRupee className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'ai':
        return <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />;
      case 'geo':
        return <Compass className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
      case 'weather':
      default:
        return <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
    }
  };

  const filtered = notifications.filter((n) => (activeTab === 'unread' ? n.unread : true));

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button with High-Contrast Icon & Positioned Badge */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 rounded-xl border-[#dcd9d0] dark:border-[#22352b] bg-white/80 dark:bg-[#15221b] text-[#111a16] dark:text-[#edf2ee] hover:bg-emerald-50/70 dark:hover:bg-[#1c2e24] hover:text-[#0d5c48] dark:hover:text-emerald-300 transition-colors shadow-2xs"
        aria-label="Notifications"
        title="View Notifications & Travel Alerts"
      >
        <Bell className="h-4 w-4 text-[#1b2b23] dark:text-[#edf2ee]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-1 text-[9px] font-mono font-bold text-white shadow-xs ring-2 ring-white dark:ring-[#121c17] animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Small Pop-up Window */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-[#e8e6df] dark:border-[#1e2e26] bg-white dark:bg-[#121c17] shadow-elevated z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Pop-up Header */}
          <div className="flex items-center justify-between border-b border-[#f0eee9] dark:border-[#1e2e26] px-4 py-3 bg-[#faf9f6]/90 dark:bg-[#18251f]/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-teal-50 dark:bg-emerald-950/60 text-[#0d5c48] dark:text-emerald-300">
                <Bell className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-serif text-sm font-bold text-[#111a16] dark:text-[#edf2ee] tracking-tight">
                  Travel Notifications
                </h3>
                <p className="text-[10px] text-[#5f7067] dark:text-[#8ca397]">
                  {unreadCount} unread intelligence alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0d5c48] dark:text-emerald-400 hover:underline px-2 py-1 rounded-md transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3 w-3" />
                  <span>Read all</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-ink-400 hover:text-ink-900 dark:hover:text-white hover:bg-sand-100 dark:hover:bg-[#1f2e26]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#f0eee9] dark:border-[#1e2e26] text-xs bg-sand-50/50 dark:bg-[#14201a]">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-[#0d5c48] text-white'
                    : 'text-ink-600 dark:text-ink-300 hover:bg-sand-100 dark:hover:bg-[#1e2e26]'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  activeTab === 'unread'
                    ? 'bg-[#0d5c48] text-white'
                    : 'text-ink-600 dark:text-ink-300 hover:bg-sand-100 dark:hover:bg-[#1e2e26]'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-[10px] font-mono text-ink-400 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[#f0eee9] dark:divide-[#1e2e26]">
            {filtered.length === 0 ? (
              <div className="py-10 text-center px-4">
                <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#0d5c48] dark:text-emerald-300 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-ink-800 dark:text-ink-200">All caught up!</p>
                <p className="text-[11px] text-ink-400 dark:text-ink-500 mt-0.5">
                  No new travel alerts or pending notifications.
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                    item.unread
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/80 dark:hover:bg-amber-950/30'
                      : 'hover:bg-sand-50/60 dark:hover:bg-[#18251f]/50'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white dark:bg-[#1a2821] border border-sand-200 dark:border-[#22332a] shrink-0 shadow-2xs mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          item.unread
                            ? 'text-ink-900 dark:text-white'
                            : 'text-ink-700 dark:text-ink-300'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-mono text-ink-400 shrink-0 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {item.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-ink-500 dark:text-ink-400 mt-1 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between pt-1">
                      {item.link ? (
                        <Link
                          href={item.link}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0d5c48] dark:text-emerald-400 hover:underline"
                        >
                          <span>{item.linkText || 'View details'}</span>
                          <span>&rarr;</span>
                        </Link>
                      ) : (
                        <span className="text-[10px] font-mono text-ink-400 uppercase">Live Notice</span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-red-500 p-1 transition-opacity"
                        title="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {item.unread && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#faf9f6] dark:bg-[#14201a] border-t border-[#f0eee9] dark:border-[#1e2e26] text-center">
            <Link
              href="/bookings"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-serif font-semibold text-[#0d5c48] dark:text-emerald-400 hover:underline inline-flex items-center gap-1.5"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Open Travel Hub & Free Booking Passes</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
