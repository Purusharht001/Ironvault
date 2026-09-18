'use client';
import { useState } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { VALIDATION } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
const emptyPasswords = { currentPassword: '', newPassword: '', confirmPassword: '' };
export function SecuritySection() {
    const { setSession } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [passwords, setPasswords] = useState(emptyPasswords);
    const [passwordError, setPasswordError] = useState(null);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const handleLogoutAllDevices = async () => {
        setIsLoggingOut(true);
        try {
            // Revokes every existing token; this device keeps working with the new one
            const response = await api.auth.logoutAll();
            setSession(response.token, response.user);
            toast.success('Signed out of all other devices');
        }
        catch (error) {
            toast.error(error.message || 'Failed to logout from all devices');
        }
        finally {
            setIsLoggingOut(false);
        }
    };
    const handlePasswordChange = (e) => {
        setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setPasswordError(null);
    };
    const handleChangePassword = async (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = passwords;
        if (!currentPassword) {
            setPasswordError('Enter your current password');
            return;
        }
        if (newPassword.length < VALIDATION.MIN_PASSWORD_LENGTH) {
            setPasswordError(`New password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`);
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }
        if (newPassword === currentPassword) {
            setPasswordError('New password must differ from the current one');
            return;
        }
        setIsSavingPassword(true);
        try {
            const response = await api.auth.changePassword({ currentPassword, newPassword });
            setSession(response.token, response.user);
            setPasswords(emptyPasswords);
            toast.success('Password updated. Other devices have been signed out');
        }
        catch (error) {
            setPasswordError(error.message || 'Failed to update password');
        }
        finally {
            setIsSavingPassword(false);
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

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="pt-4 border-t border-border space-y-4 max-w-md" noValidate>
          <div>
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              <KeyRound className="h-4 w-4" aria-hidden="true"/> Change Password
            </h3>
            <p className="text-sm text-muted-foreground">
              Changing your password signs you out everywhere else.
            </p>
          </div>
          {[
            { name: 'currentPassword', label: 'Current password', autoComplete: 'current-password' },
            { name: 'newPassword', label: 'New password', autoComplete: 'new-password' },
            { name: 'confirmPassword', label: 'Confirm new password', autoComplete: 'new-password' },
        ].map((field) => (<div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium mb-1.5">
                {field.label}
              </label>
              <Input id={field.name} name={field.name} type="password" autoComplete={field.autoComplete} value={passwords[field.name]} onChange={handlePasswordChange} disabled={isSavingPassword}/>
            </div>))}
          {passwordError && (<p className="text-sm text-destructive" role="alert">{passwordError}</p>)}
          <Button type="submit" disabled={isSavingPassword}>
            {isSavingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </form>

        {/* Logout All Devices */}
        <div className="pt-4 border-t border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Device Sessions
              </h3>
              <p className="text-sm text-muted-foreground">
                Sign out from all other devices and browsers. You stay signed in here.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isLoggingOut}>
                  <LogOut className="h-4 w-4 mr-2" aria-hidden="true"/>
                  {isLoggingOut ? 'Processing...' : 'Logout All Devices'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out of all other devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Every other browser or device signed in to this account will be signed out immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogoutAllDevices}>Sign them out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Security Tips */}
        <div className="pt-4 border-t border-border">
          <h3 className="font-semibold text-foreground mb-3">Security Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              ✓ Use a strong, unique password with at least 8 characters
            </li>
            <li>✓ Never share your login credentials with anyone</li>
            <li>✓ Regularly review your account activity and transactions</li>
            <li>
              ✓ Sign out of all devices if you suspect someone else has access
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
