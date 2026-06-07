export type Role = 'ADMIN' | 'USER';

export type AssetStatus = 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE';
export type AssetCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';
export type NotificationType = 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'BOOKING_DUE_SOON' | 'ASSET_OVERDUE' | 'BOOKING_SUBMITTED' | 'ASSET_RETURNED';
export type AuditAction = 
  | 'USER_REGISTERED' | 'USER_LOGIN'
  | 'ASSET_CREATED' | 'ASSET_UPDATED' | 'ASSET_DELETED'
  | 'BOOKING_CREATED' | 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'BOOKING_CANCELLED'
  | 'ASSET_ISSUED' | 'ASSET_RETURNED' | 'CONDITION_UPDATED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  phone?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  _count?: { assets: number };
}

export interface Asset {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category: Category;
  totalQuantity: number;
  availableQuantity: number;
  status: AssetStatus;
  condition: AssetCondition;
  qrCode?: string;
  imageUrl?: string;
  location?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  bookings?: Booking[];
  maintenanceLogs?: MaintenanceLog[];
}

export interface Booking {
  id: string;
  userId: string;
  assetId: string;
  quantity: number;
  status: BookingStatus;
  purpose: string;
  startDate: string;
  endDate: string;
  issuedAt?: string;
  returnedAt?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'department'>;
  asset: Asset;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

export interface MaintenanceLog {
  id: string;
  assetId: string;
  reportedBy?: string;
  description: string;
  condition: AssetCondition;
  resolvedAt?: string;
  cost?: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

export interface AnalyticsSummary {
  totalAssets: number;
  totalUsers: number;
  activeBookings: number;
  pendingApprovals: number;
  overdueBookings: number;
  recentBookings: number;
  totalCategories: number;
  utilizationRate: number;
}

export interface CategoryStats {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  totalAssets: number;
  totalQuantity: number;
  availableQuantity: number;
  utilizedQuantity: number;
  utilizationRate: number;
}

export interface BookingTrend {
  date: string;
  bookings: number;
}
