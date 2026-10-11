'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pill, Mail, ArrowRight, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Unable to send reset instructions');
        setLoading(false);
        return;
      }

      setSubmitted(true);
      toast.success('Reset instructions sent');
    } catch (error) {
      console.error('Forgot password submission error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 w-full max-w-full">
      <div className="max-w-md w-full space-y-6 bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-xl text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
          <Pill className="w-6 h-6" />
        </div>

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Check Your Email</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              If an account is associated with <span className="font-semibold text-slate-900">{email}</span>,
              we have sent a secure password reset link.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1.5">
              <div className="font-semibold text-slate-800">Security Tips:</div>
              <div>• The link expires in <strong>15 minutes</strong>.</div>
              <div>• Check your spam or promotions folder if it does not appear.</div>
              <div>• The link can only be used once.</div>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                Send another link
              </button>
              <Link
                href="/login"
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Reset Your Password</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered email address to receive password recovery details.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send Reset Instructions <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-xs text-slate-500 pt-2">
              Remember your password?{' '}
              <Link href="/login" className="font-bold text-emerald-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
