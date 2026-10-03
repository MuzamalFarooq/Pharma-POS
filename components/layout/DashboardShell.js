'use client';

import { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

export default function DashboardShell({
  user,
  organization,
  branch,
  role,
  branches = [],
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-100/70 font-sans antialiased text-slate-900 w-full max-w-full overflow-x-hidden relative">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop sticky + Mobile sliding drawer) */}
      <DashboardSidebar
        userRole={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
        <DashboardHeader
          user={user}
          organization={organization}
          branch={branch}
          role={role}
          branches={branches}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden min-w-0 w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
