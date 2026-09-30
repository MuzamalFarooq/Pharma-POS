import { Pill, Sparkles, ShieldCheck } from 'lucide-react';

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading PharmaPulse"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl text-white overflow-hidden select-none"
    >
      {/* Ambient Lighting Glow Orbs */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-teal-500/15 rounded-full blur-[120px] pointer-events-none animate-float-slow [animation-delay:2s]" />

      {/* Main Glassmorphic Central Box */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center">
        {/* Animated Brand Emblem with Rotating Gradient Ring */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Rotating Outer Gradient Ring */}
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-60 blur-[6px] animate-spin-slow" />
          
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-emerald-500/80 via-teal-400 to-cyan-400 p-[2px] animate-spin-slow">
            <div className="w-full h-full rounded-full bg-slate-950" />
          </div>

          {/* Core Medallion */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center">
            <Pill className="w-8 h-8 text-emerald-400 animate-pulse drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <Sparkles className="w-3.5 h-3.5 text-teal-300 absolute -top-1 -right-1 animate-bounce" />
          </div>
        </div>

        {/* Brand Name & Typography */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-emerald-200">
            PharmaPulse
          </h2>
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            LOADING
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-400 font-medium mb-6">
          Synchronizing clinical records &amp; secure data...
        </p>

        {/* ECG Vital Wave Animation */}
        <div className="w-full h-6 mb-4 relative flex items-center justify-center">
          <svg
            viewBox="0 0 240 40"
            className="w-40 h-6 text-emerald-400"
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

        {/* Animated Indeterminate Progress Bar */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-full h-2 p-[2px] mb-3 relative overflow-hidden shadow-inner">
          <div className="h-full w-full rounded-full bg-slate-800 relative overflow-hidden">
            <div className="absolute inset-0 w-2/5 h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 animate-shimmer" />
          </div>
        </div>

        {/* Security / Status Badge */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Securing POS Session</span>
        </div>
      </div>
    </div>
  );
}
