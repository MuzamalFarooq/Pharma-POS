'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Pill, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/customer-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }

      toast.success('Your customer account is ready');
      router.push(data.redirect || '/customer');
      router.refresh();
    } catch (error) {
      toast.error('An unexpected error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 w-full max-w-full">
      <div className="max-w-md w-full space-y-6 bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
            <Pill className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Create a customer account</h1>
          <p className="text-sm text-slate-500">Sign in to keep track of your pharmacy orders.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 mb-1">Full name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1">Confirm password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create customer account <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-emerald-600 hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
