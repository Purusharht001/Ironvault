'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
  },
  {
    label: 'Transfers',
    href: '/dashboard/transfers',
    icon: '💸',
  },
  {
    label: 'Transactions',
    href: '/dashboard/transactions',
    icon: '📜',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: '⚙️',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border p-6 flex flex-col h-full">
      <nav className="space-y-2 flex-1">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium',
              isActive(item.href)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer info */}
      <div className="pt-6 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/60 px-4">
          All transactions are immutable and ACID-compliant
        </p>
      </div>
    </aside>
  );
}
