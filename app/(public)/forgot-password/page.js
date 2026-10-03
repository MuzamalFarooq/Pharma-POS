'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pill, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(`If an account exists for ${email}, reset instructions have been sent.`);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 w-full max-w-full">
      <div className="max-w-md w-full space-y-6 bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-xl text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
          <Pill className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Reset Your Password</h2>
        <p className="text-xs text-slate-500">Enter your registered email address to receive password recovery details.</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@pharmacy.com"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 flex items-center justify-center gap-2"
          >
            Send Reset Instructions <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-xs text-slate-500 pt-2">
          Remember your password?{' '}
          <Link href="/login" className="font-bold text-emerald-600 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
