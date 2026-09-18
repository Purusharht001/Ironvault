'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/auth/signin');
  };

  return (
    <nav className="bg-sidebar border-b border-sidebar-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
          <span className="text-sidebar-primary-foreground font-bold">IV</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground">IronVault</h1>
          <p className="text-xs text-sidebar-foreground/60">Banking Simulator</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-sidebar-foreground">
            {user?.username}
          </p>
          <p className="text-xs text-sidebar-foreground/60">{user?.email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-sidebar-foreground hover:text-sidebar-foreground"
        >
          Logout
        </Button>
      </div>
    </nav>
  );
}
