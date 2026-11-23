import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  User,
  Shield,
  Layers,
  ChevronDown,
  Menu,
  HardHat,
  Settings,
  Trash2,
  Check,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { useAuth } from '../../context/AuthContext';

export function Header({ title, onToggleMobileSidebar }) {
  const {
    currentRole,
    setCurrentRole,
    citizenProfile,
    officerProfile,
    supervisorProfile,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    unreadNotificationCount,
    notificationError,
  } = useCivic();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const relevantNotifications = (notifications || []).filter(
    (n) => n.role === currentRole
  );
  const unreadCount = unreadNotificationCount ?? relevantNotifications.filter((n) => !n.read).length;

  const openNotification = (notification) => {
    if (!notification.read) markNotificationRead(notification.id).catch(() => {});
    const target = notification.targetUrl || (notification.complaintId
      ? currentRole === 'citizen' ? `/citizen/complaints/${encodeURIComponent(notification.complaintId)}` : '/officer/complaints'
      : currentRole === 'citizen' ? '/citizen/notifications' : '/officer/notifications');
    if (target.startsWith('/') && !target.startsWith('//')) navigate(target);
    setShowNotifications(false);
  };

  const handleRoleSwitch = (newRole) => {
    setCurrentRole(newRole);
    setShowRoleMenu(false);
    if (newRole === 'citizen') {
      navigate('/citizen');
    } else if (newRole === 'officer') {
      navigate('/officer');
    } else if (newRole === 'supervisor') {
      navigate('/supervisor');
    } else if (newRole === 'admin') {
      navigate('/admin');
    }
  };

  let activeUser = citizenProfile;
  let roleDisplayName = 'Citizen';
  let portalSubtitle = 'Citizen Portal';

  if (currentRole === 'officer') {
    activeUser = officerProfile;
    roleDisplayName = 'Officer';
    portalSubtitle = 'Municipal Operations Command';
  } else if (currentRole === 'supervisor') {
    activeUser = supervisorProfile;
    roleDisplayName = 'Supervisor';
    portalSubtitle = 'Field Operations & Supervision';
  } else if (currentRole === 'admin') {
    activeUser = {
      name: user?.name || 'Super Admin',
          avatarUrl: user?.avatarUrl || '',
      title: user?.title || 'System Administrator',
      department: 'IT Administration',
    };
    roleDisplayName = 'Admin';
    portalSubtitle = 'System Administration';
  }

  // If user object from auth is present and matches current role, overlay profile details
  if (user) {
    const roleMatches =
      (user.role === 'CITIZEN' && currentRole === 'citizen') ||
      (user.role === 'OFFICER' && currentRole === 'officer') ||
      (user.role === 'SUPERVISOR' && currentRole === 'supervisor') ||
      (user.role === 'ADMIN' && currentRole === 'admin');
    if (roleMatches) {
      activeUser = {
        ...activeUser,
        name: user.name || activeUser?.name,
        email: user.email || activeUser?.email,
        avatarUrl: user.avatarUrl || activeUser?.avatarUrl,
        department: user.department?.name || user.department || activeUser?.department,
      };
    }
  }

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
          <h1 className={`text-lg md:text-xl font-bold text-civic-text leading-tight ${currentRole === 'citizen' ? 'sr-only' : ''}`}>
            {currentRole === 'officer' && title === 'Dashboard' ? '' : title || (currentRole === 'officer' ? '' : 'Dashboard')}
          </h1>
          {currentRole !== 'officer' && <div className="flex items-center space-x-2 text-xs text-civic-muted">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-civic-blue font-medium text-[11px] border border-blue-200">
              CivicConnect Platform
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-600 font-medium">
              {portalSubtitle}
            </span>
          </div>}
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4">
        {/* DEMO ROLE SWITCHER */}
        {currentRole === 'admin' && <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-300 shadow-xs cursor-pointer"
            title="Switch between Citizen, Officer, Supervisor, and Admin view"
          >
            <Layers className="w-3.5 h-3.5 text-civic-blue" />
            <span className="hidden sm:inline">Role:</span>
            <span className="text-civic-blue font-bold">
              {roleDisplayName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Interactive View
              </div>

              <button
                onClick={() => handleRoleSwitch('citizen')}
                className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                  currentRole === 'citizen' ? 'bg-blue-50/70 font-semibold text-civic-blue' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Citizen Dashboard</p>
                    <p className="text-[11px] text-slate-400">Public grievance reporting & tracking</p>
                  </div>
                </div>
                {currentRole === 'citizen' && <span className="w-2 h-2 rounded-full bg-civic-blue"></span>}
              </button>

              <button
                onClick={() => handleRoleSwitch('officer')}
                className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                  currentRole === 'officer' ? 'bg-blue-50/70 font-semibold text-civic-blue' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Municipal Operations Staff</p>
                    <p className="text-[11px] text-slate-400">Verification, triage, assignment</p>
                  </div>
                </div>
                {currentRole === 'officer' && <span className="w-2 h-2 rounded-full bg-civic-blue"></span>}
              </button>

              <button
                onClick={() => handleRoleSwitch('supervisor')}
                className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                  currentRole === 'supervisor' ? 'bg-blue-50/70 font-semibold text-civic-blue' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <HardHat className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="font-semibold text-slate-900">Field Supervisor Dashboard</p>
                    <p className="text-[11px] text-slate-400">Crew, repair progress, materials, photos</p>
                  </div>
                </div>
                {currentRole === 'supervisor' && <span className="w-2 h-2 rounded-full bg-civic-blue"></span>}
              </button>

              <button
                onClick={() => handleRoleSwitch('admin')}
                className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                  currentRole === 'admin' ? 'bg-blue-50/70 font-semibold text-civic-blue' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Settings className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="font-semibold text-slate-900">System Administrator</p>
                    <p className="text-[11px] text-slate-400">Master configuration & audit</p>
                  </div>
                </div>
                {currentRole === 'admin' && <span className="w-2 h-2 rounded-full bg-civic-blue"></span>}
              </button>
            </div>
          )}
        </div>}

        {/* NOTIFICATION BELL */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-civic-blue hover:underline font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notificationError && <p role="alert" className="px-3 py-2 text-[11px] text-rose-700 bg-rose-50">{notificationError}</p>}
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {relevantNotifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  relevantNotifications.slice(0, 10).map((n) => (
                    <div key={n.id} className={`p-3 flex items-start gap-2 ${!n.read ? 'bg-blue-50/50' : ''}`}>
                    <button
                      onClick={() => openNotification(n)}
                      className="min-w-0 flex-1 text-left text-xs hover:text-civic-blue"
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-slate-800">{n.title}</p>
                        {!n.read && <span className="w-2 h-2 mt-1 rounded-full bg-civic-blue shrink-0" />}
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                          {n.timestamp ? new Date(n.timestamp).toLocaleString() : ''}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      {n.complaintId && <p className="mt-1 text-[10px] text-slate-400">Complaint {n.complaintCode || n.complaintId}</p>}
                    </button>
                    <div className="flex gap-1 shrink-0">
                      {!n.read && <button onClick={() => markNotificationRead(n.id).catch(() => {})} title="Mark as read" aria-label="Mark as read" className="p-1 rounded hover:bg-white text-slate-500"><Check className="w-3.5 h-3.5" /></button>}
                      <button onClick={() => deleteNotification(n.id).catch(() => {})} title="Delete notification" aria-label="Delete notification" className="p-1 rounded hover:bg-white text-slate-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100">
                {unreadCount > 0 && <button onClick={() => markAllNotificationsRead().catch(() => {})} className="text-[11px] text-civic-blue font-semibold hover:underline">Mark all as read</button>}
                {['citizen', 'officer', 'supervisor'].includes(currentRole) && <button onClick={() => { navigate(currentRole === 'citizen' ? '/citizen/notifications' : currentRole === 'officer' ? '/officer/notifications' : '/supervisor/notifications'); setShowNotifications(false); }} className="ml-auto text-[11px] text-civic-blue font-semibold hover:underline">View all notifications</button>}
              </div>
            </div>
          )}
        </div>

        {/* USER PROFILE SNIPPET */}
        <button onClick={() => ['citizen','officer'].includes(currentRole) && navigate(`/${currentRole}/profile`)} aria-label="Open profile" className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          {activeUser?.avatarUrl ? <img
            src={activeUser.avatarUrl}
            alt={activeUser?.name || 'User'}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200"
          /> : <span className="w-8 h-8 rounded-full bg-civic-blue text-white flex items-center justify-center text-xs font-bold">{(activeUser?.name || '?').trim().split(/\s+/).map((word) => word[0]).slice(0,2).join('').toUpperCase()}</span>}
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {currentRole === 'officer' ? (activeUser?.name || '') : (activeUser?.name || 'User')}
            </p>
            {currentRole !== 'officer' && <p className="text-[11px] text-slate-500 leading-tight">
              {activeUser?.department || roleDisplayName}
            </p>}
          </div>
        </button>
      </div>
    </header>
  );
}
