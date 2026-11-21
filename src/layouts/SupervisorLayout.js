import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';
import { useAuth } from '../context/AuthContext';
import { useCivic } from '../context/CivicContext';

export function SupervisorLayout({ pageTitle }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { loadSupervisorData, supervisorDataReady, supervisorDataError } = useCivic();

  useEffect(() => {
    if (user?.id) loadSupervisorData(user).catch(() => {});
  }, [user?.id]);

  if (!supervisorDataReady) {
    return <div className="min-h-screen grid place-items-center text-slate-600">Loading your assigned field operations…</div>;
  }

  return (
    <div className="flex h-screen bg-civic-bg overflow-hidden font-sans">
      <Sidebar
        role="supervisor"
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={pageTitle}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {supervisorDataError ? (
              <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
                Field Supervisor data could not be loaded: {supervisorDataError}
              </div>
            ) : <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
