import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';
import {
  LayoutDashboard, Package, Calendar, Users, BarChart3, ClipboardList,
  Settings, Bell, LogOut, Tag, ChevronRight, Boxes, Shield, FileText,Lightbulb,QrCode
} from 'lucide-react';
import { getInitials } from '../../utils';
import clsx from 'clsx';

export function Layout() {
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.list({ unreadOnly: true, limit: 1 }),
    refetchInterval: 30_000,
  });
  const unreadCount = notifData?.data?.total || 0;

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  const navLinks = isAdmin
    ? [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/assets', icon: Package, label: 'Assets' },
        { to: '/admin/bookings', icon: Calendar, label: 'Bookings' },
        { to: '/admin/categories', icon: Tag, label: 'Categories' },
        { to: '/admin/users', icon: Users, label: 'Users' },
        { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        { to: '/admin/audit', icon: FileText, label: 'Audit Log' },
        { to: '/admin/qr-scanner', icon: QrCode, label: 'QR Scanner' },
        { to: '/admin/suggestions', icon: Lightbulb, label: 'Suggestions' },
      ]
    : [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/browse', icon: Boxes, label: 'Browse Assets' },
        { to: '/my-bookings', icon: ClipboardList, label: 'My Bookings' },
        { to: '/suggestions', icon: Lightbulb, label: 'Suggest Asset' },
      ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#0d0d1f] border-r border-[rgba(99,102,241,0.12)] flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-[rgba(99,102,241,0.12)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-semibold text-[#e0e0ff] text-sm leading-tight">AssetFlow</div>
              <div className="text-xs text-[#555577]">IIT Roorkee CC</div>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-5 pt-4 pb-2">
          <div className={clsx(
            'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md w-fit',
            isAdmin
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
              : 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20'
          )}>
            {isAdmin ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
            {isAdmin ? 'Administrator' : 'Member'}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto mt-2">
          {navLinks.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={clsx(isActive ? 'nav-item-active' : 'nav-item')}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-[rgba(99,102,241,0.12)] space-y-1">
          <Link
            to="/notifications"
            className={clsx(
              location.pathname === '/notifications' ? 'nav-item-active' : 'nav-item',
              'relative'
            )}
          >
            <Bell className="w-4 h-4" />
            <span className="flex-1">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link to="/profile" className={location.pathname === '/profile' ? 'nav-item-active' : 'nav-item'}>
            <Settings className="w-4 h-4" />
            <span>Profile</span>
          </Link>

          <div className="mt-3 pt-3 border-t border-[rgba(99,102,241,0.1)] flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user?.name || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#e0e0ff] truncate">{user?.name}</div>
              <div className="text-xs text-[#555577] truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-red-500/10 text-[#555577] hover:text-red-400 transition-colors" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
