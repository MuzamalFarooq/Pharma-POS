'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pill, Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, ${data.user.name}!`);
      router.push(data.redirect || '/dashboard');
      router.refresh();
    } catch (error) {
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    toast.info(`Filled credentials for ${demoEmail}`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 w-full max-w-full">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
            <Pill className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Sign in to PharmaPulse</h2>
          <p className="text-xs text-slate-500">Access your pharmacy dashboard & live POS</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username or Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourgmail.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <Link href="/forgot-password" className="text-xs text-emerald-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        {/* DEMO SEED CREDENTIAL PRESETS */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            Quick Multi-Tenant Demo Logins
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => fillQuickDemo('owner@citycare.com', 'Password123!')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700 text-left font-medium transition-colors"
            >
              <div className="font-bold text-emerald-700">City Care Pharmacy</div>
              <div className="text-[10px] text-slate-500">Tenant A (Owner)</div>
            </button>
            <button
              onClick={() => fillQuickDemo('owner@medicoplus.com', 'Password123!')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-slate-700 text-left font-medium transition-colors"
            >
              <div className="font-bold text-teal-700">Medico Plus</div>
              <div className="text-[10px] text-slate-500">Tenant B (Owner)</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-2">
          Shopping with us?{' '}
          <Link href="/customer/register" className="font-bold text-emerald-600 hover:underline">
            Register as a customer
          </Link>
        </div>

        <div className="text-center text-xs text-slate-500">
          Don't have a pharmacy account?{' '}
          <Link href="/register" className="font-bold text-emerald-600 hover:underline">
            Register your pharmacy
          </Link>
        </div>
      </div>
    </div>
  );
}
