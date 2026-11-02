import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Menu,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { useAuth } from '../../context/AuthContext';

export function Header({ title, onToggleMobileSidebar }) {
  const {
    currentRole,
    citizenProfile,
    officerProfile,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useCivic();
  const { user } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const relevantNotifications = notifications.filter(
    (n) => n.role === currentRole
  );
  const unreadCount = relevantNotifications.filter((n) => !n.read).length;

  const activeUser = user || (currentRole === 'citizen' ? citizenProfile : officerProfile);
  const roleLabel = user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'OFFICER' ? 'Municipal Officer' : user?.role === 'SUPERVISOR' ? 'Field Officer' : 'Citizen';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg md:text-xl font-bold text-civic-text leading-tight">
            {title || 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-2 text-xs text-civic-muted">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-civic-blue font-medium text-[11px] border border-blue-200">
              Municipal Grievance System
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{roleLabel} Portal</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4">
        {/* DEMO ROLE SWITCHER */}
        <div className="relative">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-civic-blue" />
            <span className="hidden sm:inline">Role:</span>
            <span className="text-civic-blue font-bold">{roleLabel}</span>
          </div>
        </div>

        {/* NOTIFICATION BELL */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors focus:outline-hidden"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-civic-blue hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {relevantNotifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  relevantNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                        !n.read ? 'bg-blue-50/40 font-medium' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-slate-800">{n.title}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                          {n.timestamp.split(' ')[1]}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* USER PROFILE SNIPPET */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <img
            src={activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={activeUser.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200"
          />
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {activeUser.name}
            </p>
            <p className="text-[11px] text-slate-500 leading-tight">
              {roleLabel}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
