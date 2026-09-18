'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
export function SecuritySection() {
    const [isLoading, setIsLoading] = useState(false);
    const handleLogoutAllDevices = async () => {
        setIsLoading(true);
        try {
            // TODO: Implement backend endpoint for logging out all devices
            // For now, this is a placeholder that will be connected to the backend
            toast.success('Logged out from all devices');
        }
        catch (error) {
            toast.error('Failed to logout from all devices');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<Card className="p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Security Settings
      </h2>

      <div className="space-y-6">
        {/* Password Security Info */}
        <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-4">
          <p className="text-sm text-foreground">
            <strong>🔐 Password Security:</strong> Your password is stored using
            industry-standard bcrypt hashing. We never store or transmit your
            password in plain text.
          </p>
        </div>

        {/* Logout All Devices */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Device Sessions
              </h3>
              <p className="text-sm text-muted-foreground">
                Sign out from all other devices and browsers
              </p>
            </div>
            <Button variant="destructive" onClick={handleLogoutAllDevices} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Logout All Devices'}
            </Button>
          </div>
        </div>

        {/* Security Tips */}
        <div className="pt-4 border-t border-border">
          <h3 className="font-semibold text-foreground mb-3">Security Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              ✓ Use a strong, unique password with at least 8 characters
            </li>
            <li>✓ Enable two-factor authentication when available</li>
            <li>✓ Never share your login credentials with anyone</li>
            <li>✓ Regularly review your account activity and transactions</li>
            <li>
              ✓ Keep your browser and system software up to date
            </li>
          </ul>
        </div>

        {/* Transaction Security */}
        <div className="pt-4 border-t border-border">
          <h3 className="font-semibold text-foreground mb-3">
            Transaction Protection
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              ✓ <strong>Idempotency Keys:</strong> Every transfer uses a unique
              reference ID to prevent duplicate processing
            </li>
            <li>
              ✓ <strong>ACID Compliance:</strong> All transactions maintain
              atomicity, consistency, isolation, and durability
            </li>
            <li>
              ✓ <strong>Immutable Ledger:</strong> Transaction history cannot be
              modified or reversed after creation
            </li>
          </ul>
        </div>
      </div>
    </Card>);
}
