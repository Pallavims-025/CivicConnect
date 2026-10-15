import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Briefcase,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function OfficerNotifications() {
  const navigate = useNavigate();
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useCivic();

  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'

  const officerNotifs = notifications.filter((n) => n.role === 'officer');
  const filtered = officerNotifs.filter((n) => (filter === 'UNREAD' ? !n.read : true));
  const unreadCount = officerNotifs.filter((n) => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-civic-text flex items-center space-x-2">
            <Bell className="w-6 h-6 text-civic-blue" />
            <span>Operations Notification Center</span>
          </h2>
          <p className="text-xs text-civic-muted">
            High-priority alerts for new citizen complaints, SLA warnings, and repair verifications.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="text-xs text-civic-blue font-bold hover:underline flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold space-x-4">
        <button
          onClick={() => setFilter('ALL')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            filter === 'ALL'
              ? 'border-civic-blue text-civic-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Notifications ({officerNotifs.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            filter === 'UNREAD'
              ? 'border-civic-blue text-civic-blue'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No notifications matching this filter.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-5 transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                !n.read ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-xs text-slate-900">{n.title}</h4>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-civic-blue shrink-0"></span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-slate-400 block pt-1">{n.timestamp}</span>
              </div>

              {n.linkId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationRead(n.id);
                    if (n.linkId.startsWith('CC-')) {
                      navigate('/officer/complaints');
                    } else if (n.linkId.startsWith('WO-')) {
                      navigate('/officer/work-orders');
                    } else if (n.linkId.startsWith('RV-')) {
                      navigate('/officer/verifications');
                    }
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-civic-blue hover:text-white rounded-lg font-bold text-xs text-slate-700 transition-colors whitespace-nowrap self-center"
                >
                  View Record
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
