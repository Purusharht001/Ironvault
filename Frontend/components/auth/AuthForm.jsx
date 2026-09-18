'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ERROR_MESSAGES, VALIDATION } from '@/lib/constants';
import Link from 'next/link';
export function AuthForm({ type }) {
    const router = useRouter();
    const { signIn, signUp } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // Form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    // Password strength indicator
    const getPasswordStrength = (password) => {
        if (password.length < 8)
            return { level: 'weak', color: 'bg-red-500' };
        if (password.length < 12)
            return { level: 'fair', color: 'bg-orange-500' };
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
            return { level: 'good', color: 'bg-yellow-500' };
        return { level: 'strong', color: 'bg-green-500' };
    };
    const passwordStrength = type === 'signup' ? getPasswordStrength(formData.password) : null;
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError(null);
    };
    const validateForm = () => {
        if (type === 'signin') {
            if (!formData.email || !formData.password) {
                setError('Email and password are required');
                return false;
            }
            if (!formData.email.includes('@')) {
                setError('Please enter a valid email');
                return false;
            }
        }
        else {
            // Signup validation
            if (!formData.username.trim()) {
                setError('Username is required');
                return false;
            }
            if (formData.username.length < VALIDATION.MIN_USERNAME_LENGTH ||
                formData.username.length > VALIDATION.MAX_USERNAME_LENGTH) {
                setError(`Username must be between ${VALIDATION.MIN_USERNAME_LENGTH} and ${VALIDATION.MAX_USERNAME_LENGTH} characters`);
                return false;
            }
            if (!/^[A-Za-z0-9_.-]+$/.test(formData.username.trim())) {
                setError('Username may only contain letters, numbers, dots, dashes and underscores');
                return false;
            }
            if (!formData.email || !formData.email.includes('@')) {
                setError('Please enter a valid email');
                return false;
            }
            if (formData.password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
                setError(`Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`);
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return false;
            }
        }
        return true;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        if (!validateForm()) {
            setIsLoading(false);
            return;
        }
        try {
            if (type === 'signin') {
                await signIn(formData.email.trim(), formData.password);
                toast.success('Signed in successfully');
                router.push('/dashboard');
            }
            else {
                await signUp(formData.username.trim(), formData.email.trim(), formData.password);
                toast.success('Account created successfully');
                router.push('/dashboard');
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR;
            setError(errorMessage);
            toast.error(errorMessage);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
      {/* Username field (signup only) */}
      {type === 'signup' && (<div>
          <label htmlFor="username" className="block text-sm font-medium mb-2">
            Username
          </label>
          <Input id="username" name="username" type="text" placeholder="Choose your username" value={formData.username} onChange={handleChange} disabled={isLoading}/>
        </div>)}

      {/* Email field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email Address
        </label>
        <Input id="email" name="email" type="email" placeholder="your@email.com" value={formData.email} onChange={handleChange} disabled={isLoading}/>
      </div>

      {/* Password field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Password
        </label>
        <Input id="password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} disabled={isLoading}/>

        {/* Password strength indicator (signup only) */}
        {type === 'signup' && formData.password && (<div className="mt-2">
            <div className="flex items-center gap-2">
              <div className={`h-1 flex-1 rounded-full ${passwordStrength?.color}`}/>
              <span className="text-xs text-muted-foreground">
                {passwordStrength?.level}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {passwordStrength?.level === 'weak' &&
                'Add uppercase, numbers, and special characters'}
              {passwordStrength?.level === 'fair' &&
                'Consider adding uppercase letters and numbers'}
              {passwordStrength?.level === 'good' &&
                'Good password. Add numbers or special characters for strength'}
              {passwordStrength?.level === 'strong' &&
                'Strong password!'}
            </p>
          </div>)}
      </div>

      {/* Confirm password field (signup only) */}
      {type === 'signup' && (<div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} disabled={isLoading}/>
        </div>)}

      {/* Error message */}
      {error && (<div className="bg-destructive/10 border border-destructive/20 rounded p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>)}

      {/* Submit button */}
      <Button type="submit" className="w-full" disabled={isLoading} size="lg">
        {isLoading ? (<>
            <span className="animate-spin mr-2">⏳</span>
            {type === 'signin' ? 'Signing in...' : 'Creating account...'}
          </>) : (<>{type === 'signin' ? 'Sign In' : 'Create Account'}</>)}
      </Button>

      {/* Toggle form link */}
      <div className="text-center text-sm text-muted-foreground">
        {type === 'signin' ? (<>
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </>) : (<>
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </>)}
      </div>
    </form>);
}
