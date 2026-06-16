
export interface MongoInventory {
  productId: number;
  productName: string;
  totalStockAdded: number;
  currentStockAvailable: number;
  unitsSold: number;
  unitsCancelled: number;
  unitsReturned: number;
  reservedStock: number;
  lastUpdatedDate: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: number;
  name: string;
  brand?: string; // Brand identifying key
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  stock: number; // Added for inventory tracking
  userReviews?: Review[];
  status?: 'Active' | 'Disabled'; // Added for product availability activation/disabling
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  loyaltyPoints?: number;
  isBlocked?: boolean; // Added for customer management
  registrationDate?: string; // Optional customer join timestamp
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  discount?: number;
  date: string;
  deliveryDate: string;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'Out For Delivery' | 'Delivered' | 'Completed' | 'Cancelled';
  address: string;
  pointsEarned?: number;
  paymentId?: string; // Added for payment reference
  userId?: string; // Relation mapper to User account
  userEmail?: string; // Relation email key
  customerName?: string;
  customerPhone?: string;
  streetAddress?: string;
  city?: string;
  zipcode?: string;
  orderDate?: string;
  orderTime?: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
  paymentMethod?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'Welcome' | 'Festival' | 'Seasonal' | 'Birthday' | 'Special User' | 'Flash Sale';
  festivalName?: string;
  discountPercentage: number;
  maxDiscountLimit: number;
  startDate: string;
  expiryDate: string;
  minimumOrderValue: number;
  isActive: boolean;
  isUserSpecific: boolean;
  userId?: string;
  usageLimit?: number;
  restrictedProductIds?: number[];
}

export interface CouponUsage {
  id: string;
  userId: string;
  userEmail: string;
  couponCode: string;
  usageDate: string;
  discountApplied: number;
  orderId: string;
  campaignName: string;
  discountAmount: number;
  redemptionDateTime: string;
  redemptionStatus: string;
}

export interface GoogleSheetsSyncStatus {
  lastSyncTime: string;
  status: 'Success' | 'Error' | 'Syncing';
  recordsSynced: number;
  errorDetails?: string;
}

export interface AddressInfo {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export interface InventoryLog {
  id: string;
  productId: number;
  productName: string;
  previousStock: number;
  newStock: number;
  actionType: 'Purchase' | 'Restock' | 'Manual Adjustment' | 'Order Cancelled' | 'Order Placed' | 'Admin Update';
  timestamp: string;
}

export interface PaymentInfo {
  id: string;
  orderId: string;
  amount: number;
  paymentStatus: string;
  timestamp: string;
  method: string;
}

export interface AdminActivityLog {
  id: string;
  adminEmail: string;
  actionType: string;
  moduleName: string;
  description: string;
  timestamp: string;
}

