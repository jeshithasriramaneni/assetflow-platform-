import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../services/api';
import { formatDate, getInitials } from '../../utils';
import toast from 'react-hot-toast';
import { Users, Shield, User, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export function UsersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Update failed'),
  });
  const users = data?.data || [];

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#e0e0ff]">Users</h1>
        <p className="text-sm text-[#555577]">{users.length} registered members</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0d0d1f]">
            <tr>
              {['Member', 'Email', 'Department', 'Role', 'Bookings', 'Joined', 'Actions'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="table-cell text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
              </td></tr>
            ) : users.map((user: any) => (
              <tr key={user.id} className="table-row">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                      {getInitials(user.name)}
                    </div>
                    <span className="font-medium text-[#e0e0ff] text-sm">{user.name}</span>
                  </div>
                </td>
                <td className="table-cell text-xs text-[#8888aa]">{user.email}</td>
                <td className="table-cell text-xs text-[#8888aa]">{user.department || '—'}</td>
                <td className="table-cell">
                  <span className={clsx('badge border', user.role === 'ADMIN'
                    ? 'bg-indigo-600/15 text-indigo-400 border-indigo-500/30'
                    : 'bg-emerald-600/15 text-emerald-400 border-emerald-500/30')}>
                    {user.role === 'ADMIN' ? <Shield className="w-3 h-3 inline mr-1" /> : <User className="w-3 h-3 inline mr-1" />}
                    {user.role}
                  </span>
                </td>
                <td className="table-cell font-mono text-sm">{user._count?.bookings || 0}</td>
                <td className="table-cell text-xs text-[#555577]">{formatDate(user.createdAt)}</td>
                <td className="table-cell">
                  <select
                    value={user.role}
                    onChange={(e) => roleMutation.mutate({ id: user.id, role: e.target.value })}
                    className="input text-xs py-1 w-auto"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
