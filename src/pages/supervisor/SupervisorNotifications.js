import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Clock,
  Boxes,
  RotateCcw,
  ShieldCheck,
  Check,
  Filter,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function SupervisorNotifications() {
  const navigate = useNavigate();
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    supervisorProfile,
  } = useCivic();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'UNREAD' | 'WORK_ORDERS' | 'MATERIALS' | 'VERIFICATIONS'

  // Filter supervisor notifications
  const supervisorNotifications = useMemo(() => {
    return notifications.filter((n) => n.role === 'supervisor');
  }, [notifications]);

  const unreadCount = supervisorNotifications.filter((n) => !n.read).length;

  const filteredList = useMemo(() => {
    return supervisorNotifications.filter((n) => {
      if (activeTab === 'UNREAD') return !n.read;
      if (activeTab === 'WORK_ORDERS') {
        return (
          n.type === 'WORK_ORDER' ||
          n.type === 'DEADLINE' ||
          n.type === 'OVERDUE' ||
          n.title.toLowerCase().includes('work order') ||
          n.title.toLowerCase().includes('deadline') ||
          n.title.toLowerCase().includes('overdue')
        );
      }
      if (activeTab === 'MATERIALS') {
        return (
          n.type?.startsWith('MATERIAL') ||
          n.type === 'SUPPLIES_RECEIVED' ||
          n.title.toLowerCase().includes('material') ||
          n.title.toLowerCase().includes('supplies')
        );
      }
      if (activeTab === 'VERIFICATIONS') {
        return (
          n.type === 'REWORK' ||
          n.type === 'VERIFICATION_PASSED' ||
          n.title.toLowerCase().includes('verification') ||
          n.title.toLowerCase().includes('rework') ||
          n.title.toLowerCase().includes('rejected')
        );
      }
      return true;
    });
  }, [supervisorNotifications, activeTab]);

  // Navigate according to notification link
  const handleNotificationClick = (notif) => {
    markNotificationRead(notif.id);

    if (notif.linkId?.startsWith('WO-')) {
      if (notif.type === 'REWORK' || notif.type === 'VERIFICATION_PASSED') {
        navigate('/supervisor/photo-evidence');
      } else {
        navigate('/supervisor/work-orders');
      }
    } else if (notif.linkId?.startsWith('MR-')) {
      navigate('/supervisor/material-requests');
    } else if (notif.linkId?.startsWith('RV-')) {
      navigate('/supervisor/photo-evidence');
    }
  };

  // Helper for Icon & Styling
  const getNotificationIcon = (notif) => {
    const title = notif.title.toLowerCase();
    const type = notif.type || '';

    if (type === 'REWORK' || title.includes('rework') || title.includes('rejected')) {
      return {
        icon: RotateCcw,
        bg: 'bg-rose-100 text-rose-700',
        border: 'border-rose-200',
      };
    }
    if (type === 'OVERDUE' || title.includes('overdue')) {
      return {
        icon: AlertTriangle,
        bg: 'bg-red-100 text-red-700',
        border: 'border-red-200',
      };
    }
    if (type === 'DEADLINE' || title.includes('deadline')) {
      return {
        icon: Clock,
        bg: 'bg-amber-100 text-amber-700',
        border: 'border-amber-200',
      };
    }
    if (type === 'MATERIAL_APPROVED' || title.includes('material request approved') || title.includes('supplies issued')) {
      return {
        icon: Boxes,
        bg: 'bg-emerald-100 text-emerald-700',
        border: 'border-emerald-200',
      };
    }
    if (type === 'VERIFICATION_PASSED' || title.includes('verification completed') || title.includes('approved')) {
      return {
        icon: ShieldCheck,
        bg: 'bg-teal-100 text-teal-700',
        border: 'border-teal-200',
      };
    }
    return {
      icon: Briefcase,
      bg: 'bg-blue-100 text-civic-blue',
      border: 'border-blue-200',
    };
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
            <Bell className="w-6 h-6 text-civic-blue" />
            <span>Field Supervisor Notifications</span>
          </h2>
          <p className="text-xs text-civic-muted mt-0.5">
            Real-time municipal alerts for new work order assignments, deadline thresholds, material requisition decisions, and repair quality verifications.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors self-start sm:self-auto"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs (Section 14) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center space-x-2 overflow-x-auto text-xs">
        {[
          { key: 'ALL', label: `All Alerts (${supervisorNotifications.length})` },
          { key: 'UNREAD', label: `Unread (${unreadCount})` },
          { key: 'WORK_ORDERS', label: 'Work Orders & Deadlines' },
          { key: 'MATERIALS', label: 'Material Approvals' },
          { key: 'VERIFICATIONS', label: 'Verifications & Rework' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-civic-blue text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
            No notifications in this category.
          </div>
        ) : (
          filteredList.map((notif) => {
            const style = getNotificationIcon(notif);
            const Icon = style.icon;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer hover:shadow-md flex items-start justify-between gap-4 ${
                  !notif.read ? `${style.border} bg-slate-50/30` : 'border-slate-200 opacity-80'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-2xl shrink-0 ${style.bg}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-civic-blue shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{notif.message}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1">
                      <span>{notif.timestamp}</span>
                      {notif.linkId && (
                        <span className="font-mono text-civic-blue font-semibold hover:underline">
                          View Record #{notif.linkId} &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationRead(notif.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 text-xs"
                  title="Acknowledge"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
