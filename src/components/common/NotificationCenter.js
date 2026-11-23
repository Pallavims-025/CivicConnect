import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Wrench, FileText, Package, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useCivic } from '../../context/CivicContext';

export function NotificationCenter({ role }) {
  const navigate = useNavigate();
  const {
    currentRole, notifications, unreadNotificationCount, notificationError,
    markNotificationRead, markAllNotificationsRead, deleteNotification,
  } = useCivic();
  const activeRole = role || currentRole;
  const [filter, setFilter] = useState('ALL');
  const list = notifications.filter((item) => item.role === activeRole);
  const filtered = list.filter((item) => filter !== 'UNREAD' || !item.read);
  const unread = activeRole === currentRole && unreadNotificationCount !== null
    ? unreadNotificationCount : list.filter((item) => !item.read).length;

  const NotificationIcon = ({ type }) => {
    const Icon = type === 'REPAIR_VERIFICATION' ? CheckCircle2
      : type === 'WORK_ORDER' ? Wrench
        : type === 'COMPLAINT' ? FileText
          : type === 'MATERIAL_REQUEST' ? Package
            : AlertTriangle;
    return <Icon className="mt-0.5 h-4 w-4 shrink-0 text-civic-blue" />;
  };

  const openNotification = async (item) => {
    if (!item.read) await markNotificationRead(item.id).catch(() => {});
    const fallback = item.complaintId
      ? activeRole === 'citizen' ? `/citizen/complaints/${encodeURIComponent(item.complaintId)}` : '/officer/complaints'
      : `/${activeRole}/notifications`;
    const target = item.targetUrl || fallback;
    if (target.startsWith('/') && !target.startsWith('//')) navigate(target);
  };

  return <section className="max-w-4xl mx-auto space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2"><Bell className="w-5 h-5 text-civic-blue" /><h1 className="text-xl font-bold text-civic-text">Notifications</h1><span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-civic-blue">{unread} unread</span></div>
      {unread > 0 && <button onClick={() => markAllNotificationsRead().catch(() => {})} className="text-xs text-civic-blue font-semibold hover:underline">Mark all as read</button>}
    </header>
    {notificationError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{notificationError}</p>}
    <div className="flex gap-4 border-b border-slate-200 text-xs font-semibold">
      <button onClick={() => setFilter('ALL')} className={`pb-2 border-b-2 ${filter === 'ALL' ? 'border-civic-blue text-civic-blue' : 'border-transparent text-slate-500'}`}>All ({list.length})</button>
      <button onClick={() => setFilter('UNREAD')} className={`pb-2 border-b-2 ${filter === 'UNREAD' ? 'border-civic-blue text-civic-blue' : 'border-transparent text-slate-500'}`}>Unread ({unread})</button>
    </div>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
      {!filtered.length ? <div className="p-12 text-center text-sm text-slate-500">{filter === 'UNREAD' ? 'You have no unread notifications.' : 'You have no notifications yet.'}</div> : filtered.map((item) => <article key={item.id} className={`flex items-start gap-3 p-4 ${item.read ? '' : 'bg-blue-50/40'}`}>
        <NotificationIcon type={item.type} />
        <button onClick={() => openNotification(item)} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2"><span className="text-sm font-semibold text-slate-800">{item.title}</span>{!item.read && <span className="w-2 h-2 rounded-full bg-civic-blue" />}</div>
          <p className="mt-1 text-xs text-slate-600">{item.message}</p>
          {item.complaintId && <p className="mt-1 text-[11px] text-slate-500">Complaint {item.complaintCode || item.complaintId}</p>}
          <time className="mt-2 block text-[11px] text-slate-400">{item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</time>
        </button>
        <div className="flex shrink-0 gap-1">
          {!item.read && <button aria-label="Mark as read" title="Mark as read" onClick={() => markNotificationRead(item.id).catch(() => {})} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Check className="w-4 h-4" /></button>}
          <button aria-label="Delete notification" title="Delete notification" onClick={() => deleteNotification(item.id).catch(() => {})} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Trash2 className="w-4 h-4" /></button>
        </div>
      </article>)}
    </div>
  </section>;
}
