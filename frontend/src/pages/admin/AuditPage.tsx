import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../services/api';
import { AuditLog } from '../../types';
import { formatDateTime, getInitials } from '../../utils';
import { FileText, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const actionColors: Record<string, string> = {
  USER_REGISTERED: 'text-emerald-400 bg-emerald-400/10',
  USER_LOGIN: 'text-blue-400 bg-blue-400/10',
  ASSET_CREATED: 'text-indigo-400 bg-indigo-400/10',
  ASSET_UPDATED: 'text-amber-400 bg-amber-400/10',
  ASSET_DELETED: 'text-red-400 bg-red-400/10',
  BOOKING_CREATED: 'text-blue-400 bg-blue-400/10',
  BOOKING_APPROVED: 'text-emerald-400 bg-emerald-400/10',
  BOOKING_REJECTED: 'text-red-400 bg-red-400/10',
  BOOKING_CANCELLED: 'text-orange-400 bg-orange-400/10',
  ASSET_ISSUED: 'text-violet-400 bg-violet-400/10',
  ASSET_RETURNED: 'text-teal-400 bg-teal-400/10',
  CONDITION_UPDATED: 'text-amber-400 bg-amber-400/10',
};

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, actionFilter],
    queryFn: () => auditApi.list({ page, limit: 25, action: actionFilter || undefined }),
  });

  const logs: AuditLog[] = data?.data?.logs || [];
  const total = data?.data?.total || 0;
  const pages = data?.data?.pages || 1;

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">Audit Log</h1>
          <p className="text-sm text-[#555577]">{total} total events recorded</p>
        </div>
        <select className="input w-auto" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          {Object.keys(actionColors).map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0d0d1f]">
            <tr>
              {['Timestamp', 'User', 'Action', 'Entity', 'Details'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="table-cell text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
              </td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="table-cell text-center py-12 text-[#555577]">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />No audit logs
              </td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="table-row">
                <td className="table-cell text-xs font-mono text-[#555577]">{formatDateTime(log.createdAt)}</td>
                <td className="table-cell">
                  {log.user ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(log.user.name)}
                      </div>
                      <div>
                        <div className="text-xs text-[#e0e0ff]">{log.user.name}</div>
                        <div className="text-xs text-[#555577]">{log.user.role}</div>
                      </div>
                    </div>
                  ) : <span className="text-xs text-[#555577]">System</span>}
                </td>
                <td className="table-cell">
                  <span className={clsx('badge text-xs px-2 py-0.5 rounded-md', actionColors[log.action] || 'text-[#8888aa] bg-[#8888aa]/10')}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="table-cell text-xs text-[#8888aa]">
                  <span className="font-medium">{log.entityType}</span>
                  {log.entityId && <span className="font-mono text-[#555577] ml-1">#{log.entityId.slice(0, 8)}</span>}
                </td>
                <td className="table-cell text-xs text-[#555577] max-w-xs truncate">
                  {log.details ? JSON.stringify(log.details).slice(0, 80) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-[rgba(99,102,241,0.08)] flex items-center justify-between">
            <span className="text-xs text-[#555577]">Page {page} of {pages} · {total} events</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">Prev</button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs py-1 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
