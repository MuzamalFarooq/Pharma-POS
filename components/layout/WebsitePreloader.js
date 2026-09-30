'use client';

import { useState, useEffect } from 'react';
import { Pill, Activity, ShieldCheck, Sparkles } from 'lucide-react';

export default function WebsitePreloader() {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing secure environment...');
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Check if session has already displayed preloader in this browser session
    const hasLoadedBefore = sessionStorage.getItem('pharmapulse_preloader_seen');
    if (hasLoadedBefore) {
      const hideTimer = setTimeout(() => {
        setShouldRender(false);
      }, 0);
      return () => clearTimeout(hideTimer);
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        // Variable incremental speed for natural feel
        const increment = Math.floor(Math.random() * 12) + 8;
        const next = Math.min(prev + increment, 100);

        if (next < 35) {
          setStatusText('Connecting to encrypted pharmacy network...');
        } else if (next < 70) {
          setStatusText('Loading clinical database & inventory matrix...');
        } else if (next < 95) {
          setStatusText('Calibrating high-speed POS engine...');
        } else {
          setStatusText('Workspace ready. Welcome to PharmaPulse.');
        }

        return next;
      });
    }, 90);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const exitTimer = setTimeout(() => {
        setIsLoaded(true);
        sessionStorage.setItem('pharmapulse_preloader_seen', 'true');
        // Unmount from DOM after smooth transition
        const removeTimer = setTimeout(() => {
          setShouldRender(false);
        }, 700);
        return () => clearTimeout(removeTimer);
      }, 400);

      return () => clearTimeout(exitTimer);
    }
  }, [progress]);

  if (!shouldRender) return null;

  return (
    <div
      aria-hidden={isLoaded}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden transition-all duration-700 ease-out select-none ${
        isLoaded
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient Lighting Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-[140px] pointer-events-none animate-float-slow [animation-delay:2s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Glassmorphic Central Box */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center">
        {/* Animated Brand Emblem with Rotating Neon Border */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Rotating Outer Gradient Ring */}
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-70 blur-[6px] animate-spin-slow" />
          
          {/* Outer Ring Border */}
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-emerald-500/80 via-teal-400 to-cyan-400 p-[2px] animate-spin-slow">
            <div className="w-full h-full rounded-full bg-slate-950" />
          </div>

          {/* Core Medallion */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-[0_0_35px_rgba(16,185,129,0.3)] flex items-center justify-center">
            {/* Pulsing Pill Icon */}
            <div className="relative flex items-center justify-center">
              <Pill className="w-10 h-10 text-emerald-400 animate-pulse drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              <Sparkles className="w-4 h-4 text-teal-300 absolute -top-1 -right-2 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Brand Name & Typography */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-emerald-200">
            PharmaPulse
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            PRO POS
          </span>
        </div>

        {/* Subtitle / Category */}
        <p className="text-xs text-slate-400 tracking-wide font-medium mb-6">
          Enterprise Pharmacy Management &amp; Intelligence
        </p>

        {/* SVG Animated Heartbeat / ECG Vital Line */}
        <div className="w-full h-8 mb-4 relative flex items-center justify-center">
          <svg
            viewBox="0 0 240 40"
            className="w-48 h-8 text-emerald-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M0 20 H70 L80 10 L90 32 L105 4 L118 28 L126 16 L134 20 H240"
              className="animate-ecg stroke-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]"
            />
          </svg>
        </div>

        {/* Loading Progress Bar Container */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-full h-2 p-[2px] mb-3 relative overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer light bar across progress */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Progress Percentage & Status */}
        <div className="flex items-center justify-between w-full text-xs font-mono px-1">
          <span className="text-slate-400 text-[11px] truncate max-w-[220px]">
            {statusText}
          </span>
          <span className="text-emerald-400 font-bold ml-2">
            {progress}%
          </span>
        </div>

        {/* Security & Verification Pill */}
        <div className="mt-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-Bit SSL Encrypted • Realtime Sync</span>
        </div>
      </div>
    </div>
  );
}
