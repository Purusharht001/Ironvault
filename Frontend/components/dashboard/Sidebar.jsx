'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftRight, LayoutDashboard, ScrollText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
export const navigationItems = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        Icon: LayoutDashboard,
    },
    {
        label: 'Transfers',
        href: '/dashboard/transfers',
        Icon: ArrowLeftRight,
    },
    {
        label: 'Transactions',
        href: '/dashboard/transactions',
        Icon: ScrollText,
    },
    {
        label: 'Settings',
        href: '/dashboard/settings',
        Icon: Settings,
    },
];
export function useIsActive() {
    const pathname = usePathname();
    return (href) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard' || pathname === '/dashboard/';
        }
        return pathname.startsWith(href);
    };
}
export function Sidebar() {
    const isActive = useIsActive();
    return (<aside className="hidden md:flex w-64 shrink-0 bg-sidebar border-r border-sidebar-border p-6 flex-col h-full">
      <nav className="space-y-2 flex-1" aria-label="Main">
        {navigationItems.map(({ href, label, Icon }) => (<Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium', isActive(href)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}>
            <Icon className="h-5 w-5" aria-hidden="true"/>
            <span>{label}</span>
          </Link>))}
      </nav>

      {/* Footer info */}
      <div className="pt-6 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/60 px-4">
          All transactions are immutable and ACID-compliant
        </p>
      </div>
    </aside>);
}
// Bottom tab bar for small screens, where the sidebar is hidden
export function MobileNav() {
    const isActive = useIsActive();
    return (<nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar border-t border-sidebar-border grid grid-cols-4" aria-label="Main">
      {navigationItems.map(({ href, label, Icon }) => (<Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} className={cn('flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium', isActive(href) ? 'text-sidebar-primary' : 'text-sidebar-foreground/70')}>
          <Icon className="h-5 w-5" aria-hidden="true"/>
          {label}
        </Link>))}
    </nav>);
}
