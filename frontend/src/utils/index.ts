import { BookingStatus, AssetStatus, AssetCondition } from '../types';
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';

export const formatDate = (date: string | Date) =>
  format(typeof date === 'string' ? parseISO(date) : date, 'MMM d, yyyy');

export const formatDateTime = (date: string | Date) =>
  format(typeof date === 'string' ? parseISO(date) : date, 'MMM d, yyyy HH:mm');

export const timeAgo = (date: string | Date) =>
  formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true });

export const isOverdue = (endDate: string) => isBefore(parseISO(endDate), new Date());
export const isUpcoming = (startDate: string) => isAfter(parseISO(startDate), new Date());

export const bookingStatusConfig: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
  APPROVED: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  REJECTED: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
  ISSUED: { label: 'Issued', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  RETURNED: { label: 'Returned', color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/30' },
  OVERDUE: { label: 'Overdue', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
  CANCELLED: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/30' },
};

export const assetStatusConfig: Record<
  AssetStatus,
  { label: string; color: string; dot: string; bg: string }
> = {
  AVAILABLE: {
    label: 'Available',
    color: 'text-emerald-400',
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-500/10'
  },
  PARTIALLY_AVAILABLE: {
    label: 'Partial',
    color: 'text-amber-400',
    dot: 'bg-amber-400',
    bg: 'bg-amber-500/10'
  },
  UNAVAILABLE: {
    label: 'Unavailable',
    color: 'text-red-400',
    dot: 'bg-red-400',
    bg: 'bg-red-500/10'
  },
  MAINTENANCE: {
    label: 'Maintenance',
    color: 'text-orange-400',
    dot: 'bg-orange-400',
    bg: 'bg-orange-500/10'
  },
};

export const conditionConfig: Record<AssetCondition, { label: string; color: string }> = {
  EXCELLENT: { label: 'Excellent', color: 'text-emerald-400' },
  GOOD: { label: 'Good', color: 'text-blue-400' },
  FAIR: { label: 'Fair', color: 'text-amber-400' },
  POOR: { label: 'Poor', color: 'text-orange-400' },
  DAMAGED: { label: 'Damaged', color: 'text-red-400' },
};

export const categoryColors: Record<string, string> = {
  'Photography': '#3B82F6',
  'Audio Equipment': '#8B5CF6',
  'Lighting': '#F59E0B',
  'Costumes & Props': '#EC4899',
  'Recording': '#10B981',
  'Event Infrastructure': '#F97316',
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
