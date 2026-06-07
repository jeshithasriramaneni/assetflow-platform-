import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services/api';
import { Notification } from '../types';
import { timeAgo } from '../utils';
import toast from 'react-hot-toast';
import { Bell, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const notifIcons: Record<string, string> = {
  BOOKING_APPROVED: '✅',
  BOOKING_REJECTED: '❌',
  BOOKING_DUE_SOON: '⏰',
  ASSET_OVERDUE: '⚠️',
  BOOKING_SUBMITTED: '📋',
  ASSET_RETURNED: '↩️',
};

export function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ limit: 50 }),
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => { toast.success('All marked as read'); qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: Notification[] = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  return (
    <div className="p-6 max-w-2xl space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-indigo-400">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllMutation.mutate()} className="btn-secondary text-xs py-1.5">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-[#555577]">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <div className="text-sm">No notifications yet</div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={clsx(
                'card p-4 flex items-start gap-3 cursor-pointer transition-all',
                !n.isRead && 'border-indigo-500/25 bg-indigo-600/5'
              )}
              onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
            >
              <div className="text-2xl flex-shrink-0 mt-0.5">{notifIcons[n.type] || '🔔'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className={clsx('text-sm font-medium', n.isRead ? 'text-[#c0c0dd]' : 'text-[#e0e0ff]')}>{n.title}</div>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />}
                </div>
                <div className="text-xs text-[#8888aa] mt-0.5">{n.message}</div>
                <div className="text-xs text-[#555577] mt-1">{timeAgo(n.createdAt)}</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(n.id); }}
                className="p-1 rounded hover:bg-red-600/15 text-[#555577] hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
