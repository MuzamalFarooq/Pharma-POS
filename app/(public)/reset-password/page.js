'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pill, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(Boolean(token));
  const [tokenError, setTokenError] = useState(
    !token ? 'No password reset token was provided in the link.' : ''
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    async function checkToken() {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!isMounted) return;

        if (!res.ok || !data.valid) {
          setTokenError(data.error || 'This password reset link is invalid or has expired.');
        }
      } catch (err) {
        if (!isMounted) return;
        setTokenError('Unable to verify reset link. Please check your internet connection.');
      } finally {
        if (isMounted) setVerifying(false);
      }
    }

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Password requirements checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasUpper && hasLower && hasNumber && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please fulfill all password requirements before proceeding.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success('Password successfully reset! Please sign in.');
    } catch (err) {
      console.error('Password reset submit error:', err);
      toast.error('An unexpected error occurred while resetting your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 w-full max-w-full">
      <meta name="referrer" content="no-referrer" />
      <div className="max-w-md w-full space-y-6 bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
            <Pill className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Set New Password</h2>
          <p className="text-xs text-slate-500">Secure your PharmaPulse account with a strong password</p>
        </div>

        {verifying ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs text-slate-500">Verifying security token...</p>
          </div>
        ) : tokenError ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Link Expired or Invalid</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{tokenError}</p>
            </div>
            <div className="pt-2">
              <Link
                href="/forgot-password"
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                Request a new password reset link <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Password Reset Complete!</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Your password has been securely updated. You can now log into your PharmaPulse account using your new credentials.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition"
              >
                Sign In Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Policy Checklist */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
                Password Requirements
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className="text-xs">{hasMinLength ? '✓' : '•'}</span> 8+ characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className="text-xs">{hasUpper ? '✓' : '•'}</span> Uppercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className="text-xs">{hasLower ? '✓' : '•'}</span> Lowercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <span className="text-xs">{hasNumber ? '✓' : '•'}</span> Number
                </div>
              </div>
              {confirmPassword.length > 0 && (
                <div className={`text-[11px] pt-1 flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-600 font-medium' : 'text-rose-500'}`}>
                  <span>{passwordsMatch ? '✓' : '✕'}</span> {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Reset Password
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-500 pt-1">
          Remembered your password?{' '}
          <Link href="/login" className="font-bold text-emerald-600 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
