import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  MessageSquare,
  User,
  HelpCircle,
  LogOut,
  Map,
  Copy,
  Briefcase,
  Package,
  CheckCircle,
  BarChart3,
  Bell,
  History,
  Building2,
  X,
  Users,
  Camera,
  TrendingUp,
  ClipboardList,
  Boxes,
  FileSpreadsheet,
  HardHat,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { useAuth } from '../../context/AuthContext';
import { resolveSupervisorAvatarUrl } from '../../services/supervisorApi';

export function Sidebar({ role = 'citizen', isOpen, onClose }) {
  const navigate = useNavigate();
  const {
    complaints = [],
    workOrders = [],
    verifications = [],
    duplicates = [],
    notifications = [],
    materialRequests = [],
    supervisorProfile,
  } = useCivic();
  const { logout, user } = useAuth();

  const citizenPendingCount = complaints.filter(
    (c) => c.status === 'PENDING' || c.status === 'UNDER_REVIEW'
  ).length;

  const officerPendingCount = complaints.filter(
    (c) => c.status === 'PENDING'
  ).length;

  const pendingVerificationCount = verifications ? verifications.filter(
    (v) => v.status === 'AWAITING_VERIFICATION'
  ).length : 0;

  const pendingDuplicateCount = duplicates ? duplicates.filter(
    (d) => d.reviewStatus === 'PENDING_REVIEW'
  ).length : 0;

  // Supervisor metrics
  const supervisorActiveWOCount = workOrders ? workOrders.filter(
    (w) => w.status === 'IN_PROGRESS' || w.status === 'OVERDUE' || w.status === 'REWORK_REQUIRED'
  ).length : 0;

  const supervisorPendingRequestsCount = materialRequests ? materialRequests.filter(
    (m) => m.status === 'Pending Approval' || m.status === 'PENDING'
  ).length : 0;

  const supervisorUnreadNotifCount = notifications ? notifications.filter(
    (n) => n.role === 'supervisor' && !n.read
  ).length : 0;

  // Section: Citizen Sidebar Navigation
  const citizenNav = [
    { label: 'Dashboard', path: '/citizen', icon: LayoutDashboard },
    { label: 'Report Complaint', path: '/citizen/report', icon: PlusCircle, badge: 'New', badgeColor: 'bg-emerald-500' },
    { label: 'My Complaints', path: '/citizen/complaints', icon: FileText, count: complaints.length },
    { label: 'My Feedback', path: '/citizen/feedback', icon: MessageSquare },
    { label: 'Notifications', path: '/citizen/notifications', icon: Bell },
    { label: 'Profile', path: '/citizen/profile', icon: User },
    { label: 'Help & Support', path: '/citizen/help', icon: HelpCircle },
  ];

  // Section: Municipal Officer Sidebar Navigation
  const officerNav = [
    { label: 'Officer Dashboard', path: '/officer', icon: LayoutDashboard },
    { label: 'Assigned Complaints', path: '/officer/complaints', icon: FileText, count: officerPendingCount, countColor: 'bg-amber-500' },
    { label: 'Complaint Map', path: '/officer/map', icon: Map },
    { label: 'Duplicate Detection', path: '/officer/duplicates', icon: Copy, count: pendingDuplicateCount, countColor: 'bg-purple-500' },
    { label: 'Work Orders', path: '/officer/work-orders', icon: Briefcase, count: workOrders.filter((w) => w.status === 'IN_PROGRESS').length },
    { label: 'Materials & Inventory', path: '/officer/inventory', icon: Package },
    { label: 'Repair Verification', path: '/officer/verifications', icon: CheckCircle, count: pendingVerificationCount, countColor: 'bg-rose-500' },
    { label: 'Reports & Analytics', path: '/officer/analytics', icon: BarChart3 },
    { label: 'Notifications', path: '/officer/notifications', icon: Bell },
    { label: 'Audit History', path: '/officer/audit', icon: History },
    { label: 'Profile', path: '/officer/profile', icon: User },
  ];

  // Section: Admin Sidebar Navigation
  const adminNav = [
    { label: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'User Management', path: '/admin/users', icon: Users },
    { label: 'Departments', path: '/admin/departments', icon: Building2 },
    { label: 'System Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Audit History', path: '/admin/audit', icon: History },
    { label: 'Profile', path: '/admin/profile', icon: User },
  ];

  // Section: Field Supervisor Sidebar Navigation
  const supervisorNav = [
    { label: 'Supervisor Dashboard', path: '/supervisor', icon: LayoutDashboard },
    { label: 'Assigned Work Orders', path: '/supervisor/work-orders', icon: Briefcase, count: supervisorActiveWOCount, countColor: 'bg-blue-500' },
    { label: 'Repair Progress Tracking', path: '/supervisor/repair-progress', icon: TrendingUp },
    { label: 'Photo Evidence', path: '/supervisor/photo-evidence', icon: Camera },
    { label: 'Material Inventory', path: '/supervisor/material-inventory', icon: Boxes },
    { label: 'Material Requests', path: '/supervisor/material-requests', icon: ClipboardList, count: supervisorPendingRequestsCount, countColor: 'bg-amber-500' },
    { label: 'Progress Reports', path: '/supervisor/progress-reports', icon: FileSpreadsheet },
    { label: 'Notifications', path: '/supervisor/notifications', icon: Bell, count: supervisorUnreadNotifCount, countColor: 'bg-rose-500' },
    { label: 'Profile', path: '/supervisor/profile', icon: User },
  ];

  let items = citizenNav;
  if (role === 'officer') items = officerNav;
  else if (role === 'supervisor') items = supervisorNav;
  else if (role === 'admin') items = adminNav;

  const handleSignOut = () => {
    if (logout) {
      logout().finally(() => navigate('/login', { replace: true }));
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 h-screen md:h-full max-h-screen bg-[#163A63] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } shadow-2xl md:shadow-none select-none`}
      >
        <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
          {/* Brand Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-civic-blue flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white flex items-center">
                  Civic<span className="text-blue-400">Connect</span>
                </span>
                <p className="text-[10px] text-blue-200/80 -mt-0.5">Municipal Portal</p>
              </div>
            </div>

            {role === 'admin' && (
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-lg text-white/70 hover:bg-white/10 cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Current Mode Badge */}
          {role !== 'admin' && (
            <div className="px-4 py-2.5 bg-[#0F2742]/50 border-b border-white/5 flex items-center justify-between text-xs shrink-0">
              <span className="text-blue-200/70 text-[11px] font-medium uppercase tracking-wider flex items-center space-x-1">
                {role === 'supervisor' && <HardHat className="w-3 h-3 text-amber-400 mr-1" />}
                <span>
                  {role === 'citizen'
                    ? ''
                    : role === 'officer'
                    ? 'Operations Staff'
                    : ''}
                </span>
              </span>
              {role === 'supervisor' && (
                <div className="ml-2 flex min-w-0 items-center gap-2" title={supervisorProfile?.name || user?.name || ''}>
                  {resolveSupervisorAvatarUrl(supervisorProfile?.avatarUrl) ? (
                    <img src={resolveSupervisorAvatarUrl(supervisorProfile.avatarUrl)} alt="" className="h-7 w-7 shrink-0 rounded-full border border-white/20 object-cover" />
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                      {(supervisorProfile?.name || user?.name || '?').trim().split(/\s+/).map((word) => word[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                  )}
                  <span className="max-w-24 truncate text-[11px] font-semibold text-white">
                    {supervisorProfile?.name || user?.name || 'Field Supervisor'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={
                    item.path === '/citizen' ||
                    item.path === '/officer' ||
                    item.path === '/supervisor' ||
                    item.path === '/admin'
                  }
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-civic-blue text-white shadow-md font-semibold'
                        : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md text-white ${
                        item.badgeColor || 'bg-blue-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                        item.countColor || 'bg-white/20 text-white'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* In-Nav Direct Sign Out Button */}
            <div className="pt-3 mt-3 border-t border-white/10">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/25 hover:text-white transition-colors cursor-pointer border border-rose-500/20"
              >
                <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Sign out</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-white/10 space-y-2 shrink-0">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-200 hover:bg-rose-500/20 hover:text-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
