export interface FranchiseSession {
  uid: string;
  email: string;
  franchiseId: string;
  franchiseName: string;
  role: 'franchise_owner' | 'franchise_manager' | 'owner';
  branchIds: string[];
  isAuthenticated?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  managerName?: string;
  managerEmail?: string;
  activeOrdersCount?: number;
  todaySales?: number;
  isOpen?: boolean;
  deliveryRadiusKm?: number;
  openingTime?: string;
  closingTime?: string;
}

export interface POSTerminal {
  id?: string;
  terminalId: string;
  terminalName: string;
  franchiseId: string;
  branchId: string;
  branchName?: string;
  status: 'ACTIVE' | 'PENDING_ACTIVATION' | 'REVOKED' | 'DISABLED';
  activationCode?: string;
  activationStatus?: string;
  isActive?: boolean;
  isOnline?: boolean;
  assignedUserName?: string;
  todaySales?: number;
  todayOrders?: number;
  currentShift?: string;
  createdAt?: string;
  lastActiveAt?: string | null;
  lastSeenAt?: string | null;
}

export interface FranchiseOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  branchId: string;
  branchName?: string;
  franchiseId: string;
  source: 'ONLINE_APP' | 'ONLINE_WEB' | 'POS_DINE_IN' | 'POS_TAKEAWAY' | 'POS_DELIVERY';
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    size?: string;
    crust?: string;
  }>;
  totalAmount: number;
  paymentMethod: 'UPI' | 'CASH' | 'CARD' | 'ONLINE';
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  riderName?: string;
  riderPhone?: string;
  createdAt: string;
  estimatedDeliveryTime?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  description?: string;
  image?: string;
  branchOverrides?: Record<string, { isAvailable?: boolean; customPrice?: number }>;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  status: 'AVAILABLE' | 'ON_DELIVERY' | 'OFFLINE';
  branchId: string;
  branchName?: string;
  currentOrderId?: string;
  completedTodayCount: number;
  rating: number;
  lastActiveAt: string;
}
