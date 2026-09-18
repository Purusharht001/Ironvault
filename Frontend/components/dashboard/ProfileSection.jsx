'use client';
import { Card } from '@/components/ui/card';
export function ProfileSection({ user, account }) {
    if (!user || !account) {
        return (<Card className="p-6">
        <p className="text-muted-foreground">Loading profile...</p>
      </Card>);
    }
    return (<Card className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Profile Information
      </h2>

      <div className="space-y-6">
        {/* Username */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Username</p>
          <p className="text-lg font-semibold text-foreground">{user.username}</p>
        </div>

        {/* Email */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Email Address</p>
          <p className="text-lg font-semibold text-foreground">{user.email}</p>
        </div>

        {/* Account Number */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Account Number</p>
          <code className="block bg-muted px-4 py-3 rounded font-mono text-lg font-semibold text-foreground">
            {account.accountNumber}
          </code>
        </div>

        {/* Member Since */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Member Since</p>
          <p className="text-lg font-semibold text-foreground">
            {new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })}
          </p>
        </div>

        <p className="text-xs text-muted-foreground italic pt-4 border-t border-border">
          ℹ️ Profile information is read-only. Contact support to modify your
          account details.
        </p>
      </div>
    </Card>);
}
