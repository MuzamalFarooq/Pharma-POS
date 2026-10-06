'use client';

import Link from 'next/link';
import { Pill, ArrowRight, Moon, Sun, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.toggle('dark');
      setIsDarkMode(isDark);
    }
  };

  const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Shop', href: '/shop' },
    { name: 'My Orders', href: '/customer' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-2 sm:top-4 z-50 max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 w-full pt-1 sm:pt-4">
      {/* Floating Pill Container */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] dark:shadow-slate-950/50 px-3.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between transition-all w-full max-w-full">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1 sm:gap-1.5 truncate">
              PharmaPulse <span className="hidden sm:inline-block text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">SaaS</span>
            </span>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[15px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* RIGHT CONTROLS: DASHBOARD BUTTON + THEME + HAMBURGER */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* DASHBOARD BUTTON (Vibrant Red Pill) */}
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 bg-[#EA2424] hover:bg-[#D61F1F] text-white font-bold text-xs sm:text-sm px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full shadow-[0_8px_20px_-4px_rgba(234,36,36,0.4)] hover:shadow-[0_10px_24px_-4px_rgba(234,36,36,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </Link>

          {/* DARK MODE / THEME BUTTON */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none rounded-full"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8] text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
            )}
          </button>

          {/* MOBILE MENU BUTTON (2-line minimal hamburger) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 stroke-[2]" />
              ) : (
                <div className="flex flex-col gap-1.5 w-5 items-end justify-center">
                  <span className="w-5 h-[2px] bg-slate-700 dark:bg-slate-200 rounded-full" />
                  <span className="w-3.5 h-[2px] bg-slate-700 dark:bg-slate-200 rounded-full" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 transition-all">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-3 py-2 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full text-center py-3 rounded-full border border-slate-300 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="w-full text-center py-3 rounded-full bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
