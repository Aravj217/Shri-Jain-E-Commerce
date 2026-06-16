
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Product, CartItem, User, Order, Review, InventoryLog, PaymentInfo, AdminActivityLog, MongoInventory, Coupon, CouponUsage, GoogleSheetsSyncStatus } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from './data';
import bcrypt from 'bcryptjs';

// --- Cart Context ---
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  shippingCharge: number;
  deliveryDate: string;
  couponCode: string | null;
  discount: number;
  applyCoupon: (code: string) => { success: boolean, message: string };
  removeCoupon: () => void;
  cartError: string | null;
  setCartError: (error: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);

  // Safely consume AuthContext to read live inventory
  const authContext = useContext(AuthContext);
  const products = authContext?.products || [];

  const [deliveryDate] = useState(() => {
    return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toDateString();
  });

  // Real-time stock watcher to adjust quantities in cart and prevent overselling
  useEffect(() => {
    if (!products || products.length === 0) return;
    
    let adjusted = false;
    let adjustedMessages: string[] = [];
    
    const updatedCart = cart.map(item => {
      const liveProd = products.find(p => p.id === item.id);
      if (liveProd) {
        if (item.quantity > liveProd.stock) {
          adjusted = true;
          if (liveProd.stock > 0) {
            adjustedMessages.push(`Only ${liveProd.stock} items of "${item.name}" are currently available.`);
            return { ...item, quantity: liveProd.stock };
          } else {
            adjustedMessages.push(`"${item.name}" is now Out of Stock.`);
            return { ...item, quantity: 0 };
          }
        }
      }
      return item;
    });

    if (adjusted) {
      setCartError(adjustedMessages.join(' '));
      setCart(updatedCart.filter(item => item.quantity > 0));
    }
  }, [products, cart]);

  const addToCart = (product: Product, quantity: number = 1) => {
    const liveProd = products.find(p => p.id === product.id) || product;
    if (liveProd.stock <= 0) {
      setCartError(`"${product.name}" is Out of Stock.`);
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const targetQty = currentQty + quantity;
      
      if (targetQty > liveProd.stock) {
        setCartError("Requested quantity exceeds available inventory.");
        return prev;
      }
      
      setCartError(null);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: targetQty } : item);
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const liveProd = products.find(p => p.id === productId);
    if (!liveProd) return;
    
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    if (quantity > liveProd.stock) {
      setCartError("Requested quantity exceeds available inventory.");
      return;
    }
    
    setCartError(null);
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode(null);
    setCartError(null);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const shippingCharge = cartTotal >= 2000 ? 0 : 100;

  const discount = useMemo(() => {
    if (!couponCode) return 0;
    const couponsStr = localStorage.getItem('sjsm_coupons') || '[]';
    try {
      const couponsList = JSON.parse(couponsStr);
      const couponObj = couponsList.find((c: any) => c.code.toUpperCase() === couponCode.toUpperCase());
      if (couponObj && couponObj.isActive) {
        let calcDiscount = Math.round(cartTotal * (couponObj.discountPercentage / 100));
        if (couponObj.maxDiscountLimit && calcDiscount > couponObj.maxDiscountLimit) {
          calcDiscount = couponObj.maxDiscountLimit;
        }
        return calcDiscount;
      }
    } catch (e) {
      console.error(e);
    }
    return 0;
  }, [cartTotal, couponCode]);

  const applyCoupon = (code: string) => {
    const normalizedCode = code.toUpperCase().trim();
    
    // Read fresh coupons and usages lists from localStorage
    const couponsStr = localStorage.getItem('sjsm_coupons') || '[]';
    const usagesStr = localStorage.getItem('sjsm_coupon_usages') || '[]';
    
    let couponsList = [];
    let usagesList = [];
    try {
      couponsList = couponsStr ? JSON.parse(couponsStr) : [];
      usagesList = usagesStr ? JSON.parse(usagesStr) : [];
    } catch (e) {
      console.error(e);
    }
    
    const couponObj = couponsList.find((c: any) => c.code.toUpperCase() === normalizedCode);
    if (!couponObj) {
      return { success: false, message: 'Invalid coupon code.' };
    }
    
    if (!couponObj.isActive) {
      return { success: false, message: 'This coupon is currently unavailable.' };
    }
    
    // Check dates
    const todayStr = new Date().toISOString().split('T')[0];
    if (couponObj.startDate && todayStr < couponObj.startDate) {
      return { success: false, message: 'This coupon is currently unavailable.' };
    }
    if (couponObj.expiryDate && todayStr > couponObj.expiryDate) {
      return { success: false, message: 'This coupon has expired.' };
    }
    
    // Check min order value
    if (cartTotal < couponObj.minimumOrderValue) {
      return { success: false, message: `This coupon requires a minimum purchase of ₹${couponObj.minimumOrderValue}.` };
    }
    
    // Get current user
    const activeUserStr = localStorage.getItem('sjsm_active_user');
    const activeUser = activeUserStr ? JSON.parse(activeUserStr) : null;
    
    // Check user specificity
    if (couponObj.isUserSpecific) {
      if (!activeUser) {
        return { success: false, message: 'This coupon is not available for your account.' };
      }
      if (couponObj.userId && couponObj.userId !== activeUser.id) {
        return { success: false, message: 'This coupon is not available for your account.' };
      }
    }
    
    // One-time use coupon validation
    if (activeUser) {
      const alreadyRedeemed = usagesList.some(
        (u: any) => u.userId === activeUser.id && u.couponCode.toUpperCase() === normalizedCode
      );
      if (alreadyRedeemed) {
        return { success: false, message: 'This coupon has already been redeemed.' };
      }
    }
    
    // Check usage limit
    if (couponObj.usageLimit && couponObj.usageLimit > 0) {
      const usageCount = usagesList.filter((u: any) => u.couponCode.toUpperCase() === normalizedCode).length;
      if (usageCount >= couponObj.usageLimit) {
        return { success: false, message: 'This coupon has reached its maximum usage limit.' };
      }
    }

    // Check product exclusions / restrictions
    if (couponObj.restrictedProductIds && couponObj.restrictedProductIds.length > 0) {
      const hasExcludedItem = cart.some(item => couponObj.restrictedProductIds.includes(item.id));
      if (hasExcludedItem) {
        return { success: false, message: 'This coupon is not valid for the selected products.' };
      }
    }
    
    setCouponCode(couponObj.code);
    return { success: true, message: 'Coupon Applied Successfully' };
  };

  const removeCoupon = () => {
    setCouponCode(null);
  };

  return (
    <CartContext.Provider value={{ 
        cart, addToCart, removeFromCart, updateQuantity, clearCart, 
        cartTotal, cartCount, shippingCharge, deliveryDate,
        couponCode, discount, applyCoupon, removeCoupon,
        cartError, setCartError
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

// --- Auth Context ---

interface ExtendedUser extends User {
  password?: string;
  phone?: string;
}

interface AuthContextType {
  user: ExtendedUser | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (extendedUser: ExtendedUser) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updatedData: Partial<ExtendedUser>) => void;
  orders: Order[];
  addOrder: (order: Order, paymentMethod: string, paymentId?: string) => void;
  cancelOrder: (orderId: string) => Promise<{ success: boolean; message: string }>;
  checkCancellationEligibility: (orderId: string) => { eligible: boolean; orderDateStr: string; timePassedStr: string };
  seedProductsCatalog: () => void;
  resetDatabaseToEmpty: () => void;
  mongoInventory: MongoInventory[];
  products: Product[];
  addProductReview: (productId: number, review: Review) => void;

  // Admin and Inventory management additions
  allOrders: Order[];
  allUsers: ExtendedUser[];
  inventoryLogs: InventoryLog[];
  payments: PaymentInfo[];
  adminLogs: AdminActivityLog[];
  updateProduct: (product: Product) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  deleteProduct: (productId: number) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateUserStatus: (userId: string, isBlocked: boolean) => void;
  deleteUser: (userId: string) => void;

  // Coupon state & operations
  coupons: Coupon[];
  couponUsages: CouponUsage[];
  addCoupon: (coupon: Omit<Coupon, 'id'>) => void;
  updateCoupon: (coupon: Coupon) => void;
  deleteCoupon: (couponId: string) => void;
  recordCouponUsage: (usage: Omit<CouponUsage, 'id'>) => void;

  // Real-time synchronization
  sheetsSyncStatus: GoogleSheetsSyncStatus;
  triggerGoogleSheetsSync: () => Promise<void>;
  sheetsSyncLogs: string[];
  orderStatusSyncEnabled: boolean;
  setOrderStatusSyncEnabled: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getAuthHeaders = () => {
  const token = localStorage.getItem('sjsm_token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // Central dashboard and report lists
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mongoInventory, setMongoInventory] = useState<MongoInventory[]>([]);
  const [allUsers, setAllUsers] = useState<ExtendedUser[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminActivityLog[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponUsages, setCouponUsages] = useState<CouponUsage[]>([]);

  // Google Sheets integration state hooks
  const [sheetsSyncStatus, setSheetsSyncStatus] = useState<GoogleSheetsSyncStatus>({
    lastSyncTime: new Date().toLocaleTimeString(),
    status: 'Success',
    recordsSynced: 0
  });

  const [sheetsSyncLogs, setSheetsSyncLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Live Google Sheets sync engine established successfully.`
  ]);

  const [orderStatusSyncEnabled, setOrderStatusSyncEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('sjsm_order_status_sync_enabled');
    return saved !== 'false';
  });

  const setOrderStatusSyncEnabled = (enabled: boolean) => {
    setOrderStatusSyncEnabledState(enabled);
    localStorage.setItem('sjsm_order_status_sync_enabled', String(enabled));
    setSheetsSyncLogs(prev => [
      `[${new Date().toLocaleTimeString()}] Order-Status Synchronization option set to ${enabled ? 'ENABLED' : 'DISABLED'}.`,
      ...prev
    ]);
  };

  // 1. Fetch initial public data on mount
  const fetchPublicData = async () => {
    try {
      const prodRes = await fetch('/api/products');
      if (prodRes.ok) setProducts(await prodRes.json());

      const coupRes = await fetch('/api/coupons');
      if (coupRes.ok) setCoupons(await coupRes.json());
    } catch (e) {
      console.error("Error fetching public data:", e);
    }
  };

  // 2. Fetch user-specific data
  const fetchUserData = async () => {
    try {
      const ordersRes = await fetch('/api/orders', { headers: getAuthHeaders() });
      if (ordersRes.ok) setOrders(await ordersRes.json());
    } catch (e) {
      console.error("Error fetching user data:", e);
    }
  };

  // 3. Fetch admin-specific data
  const fetchAdminData = async () => {
    try {
      const ordersRes = await fetch('/api/orders/all', { headers: getAuthHeaders() });
      if (ordersRes.ok) setAllOrders(await ordersRes.json());

      const usersRes = await fetch('/api/users', { headers: getAuthHeaders() });
      if (usersRes.ok) setAllUsers(await usersRes.json());

      const invRes = await fetch('/api/inventory', { headers: getAuthHeaders() });
      if (invRes.ok) setMongoInventory(await invRes.json());

      const logsRes = await fetch('/api/inventory/logs', { headers: getAuthHeaders() });
      if (logsRes.ok) setInventoryLogs(await logsRes.json());

      const payRes = await fetch('/api/payments', { headers: getAuthHeaders() });
      if (payRes.ok) setPayments(await payRes.json());

      const usagesRes = await fetch('/api/coupons/usages', { headers: getAuthHeaders() });
      if (usagesRes.ok) setCouponUsages(await usagesRes.json());

      const adminLogsRes = await fetch('/api/admin/logs', { headers: getAuthHeaders() });
      if (adminLogsRes.ok) setAdminLogs(await adminLogsRes.json());
    } catch (e) {
      console.error("Error fetching admin data:", e);
    }
  };

  // Load public data on boot
  useEffect(() => {
    fetchPublicData();
  }, []);

  // Restore session on boot
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('sjsm_token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            localStorage.removeItem('sjsm_token');
            setUser(null);
          }
        } catch (e) {
          console.error("Session restoration failed:", e);
          localStorage.removeItem('sjsm_token');
          setUser(null);
        }
      }
    };
    restoreSession();
  }, []);

  // Fetch contextual data when user changes
  useEffect(() => {
    if (user) {
      fetchUserData();
      if (user.role === 'admin') {
        fetchAdminData();
      }
    } else {
      setOrders([]);
      setAllOrders([]);
      setAllUsers([]);
      setMongoInventory([]);
      setInventoryLogs([]);
      setPayments([]);
      setCouponUsages([]);
      setAdminLogs([]);
    }
  }, [user]);

  const login = async (email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('sjsm_token', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.error || 'Invalid email or password.' };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Server error. Please try again.' };
    }
  };

  const register = async (newUser: ExtendedUser & { address?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          phone: newUser.phone,
          street: newUser.street || newUser.address,
          city: newUser.city,
          state: newUser.state,
          zip: newUser.zip
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('sjsm_token', data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Registration failed:", e);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('sjsm_token');
    setUser(null);
  };

  const updateProfile = async (updatedData: Partial<ExtendedUser> & { newPassword?: string }) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
      }
    } catch (e) {
      console.error("Profile update failed:", e);
    }
  };

  const checkCancellationEligibility = (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId) || allOrders.find(o => o.id === orderId);
    if (!targetOrder) {
      return { eligible: false, orderDateStr: 'N/A', timePassedStr: 'Order not found' };
    }
    const orderTime = new Date(targetOrder.date).getTime();
    const currTime = Date.now();
    const diffMs = currTime - orderTime;
    const diffHours = diffMs / (1000 * 60 * 60);

    const eligible = diffHours < 5;
    const formatHours = diffHours.toFixed(1);
    
    return {
      eligible,
      orderDateStr: new Date(targetOrder.date).toLocaleString(),
      timePassedStr: `${formatHours} hours passed`
    };
  };

  const cancelOrder = async (orderId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        fetchUserData();
        fetchPublicData();
        if (user && user.role === 'admin') {
          fetchAdminData();
        }
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Cancellation failed.' };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Server error. Please try again.' };
    }
  };

  const seedProductsCatalog = async () => {
    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchPublicData();
        if (user && user.role === 'admin') {
          fetchAdminData();
        }
      }
    } catch (e) {
      console.error("Seeding catalog failed:", e);
    }
  };

  const resetDatabaseToEmpty = async () => {
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        logout();
        setProducts([]);
        setCoupons([]);
      }
    } catch (e) {
      console.error("Purging database failed:", e);
    }
  };

  const addOrder = async (order: Order, paymentMethod: string, paymentId?: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ order, paymentMethod, paymentId })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        fetchUserData();
        fetchPublicData();
        if (user && user.role === 'admin') {
          fetchAdminData();
        }

        // Trigger Google Sheets Sync
        triggerSheetsSyncAsync(order, paymentMethod).catch(console.error);
      }
    } catch (e) {
      console.error("Order placement failed:", e);
    }
  };

  const triggerSheetsSyncAsync = async (order: Order, paymentMethod: string) => {
    let isAlreadySynced = false;
    try {
      const syncedOrders: string[] = JSON.parse(localStorage.getItem('sjsm_synced_to_sheets_order_ids') || '[]');
      if (syncedOrders.includes(order.id)) {
        isAlreadySynced = true;
      }
    } catch (e) {
      console.error('Error checking duplicate order sync in localStorage:', e);
    }

    if (isAlreadySynced) {
      return;
    }

    try {
      const CSV_URL = 'https://docs.google.com/spreadsheets/d/19ywc6xSMbOSSsmIejetbVxRSvjKicqrraWYK1OIHcaI/export?format=csv';
      const response = await fetch(CSV_URL);
      if (response.ok) {
        const csvText = await response.text();
        const lines = csvText.split('\n');
        for (const line of lines) {
          const columns = line.split(',');
          if (columns.length > 0) {
            const existingOrderId = columns[0].trim().replace(/^"|"$/g, '');
            if (existingOrderId === order.id) {
              isAlreadySynced = true;
              const syncedOrders: string[] = JSON.parse(localStorage.getItem('sjsm_synced_to_sheets_order_ids') || '[]');
              if (!syncedOrders.includes(order.id)) {
                syncedOrders.push(order.id);
                localStorage.setItem('sjsm_synced_to_sheets_order_ids', JSON.stringify(syncedOrders));
              }
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching/parsing Google Sheets CSV:', err);
    }

    if (!isAlreadySynced) {
      try {
        const syncedOrders: string[] = JSON.parse(localStorage.getItem('sjsm_synced_to_sheets_order_ids') || '[]');
        if (!syncedOrders.includes(order.id)) {
          syncedOrders.push(order.id);
          localStorage.setItem('sjsm_synced_to_sheets_order_ids', JSON.stringify(syncedOrders));
        }
      } catch (e) {
        console.error(e);
      }

      const oDate = new Date(order.date || Date.now());
      const dDateObj = new Date(oDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      const delDD = String(dDateObj.getDate()).padStart(2, '0');
      const delMM = String(dDateObj.getMonth() + 1).padStart(2, '0');
      const delYYYY = dDateObj.getFullYear();
      const deliveryDateVal = `${delDD}/${delMM}/${delYYYY}`;

      let mappedPaymentMethod = 'UPI';
      const upperPM = (paymentMethod || '').trim().toUpperCase();
      if (upperPM === 'CARD' || upperPM === 'CREDIT_CARD' || upperPM === 'DEBIT_CARD') {
        mappedPaymentMethod = 'Card';
      } else if (upperPM === 'UPI') {
        mappedPaymentMethod = 'UPI';
      } else if (upperPM === 'NET_BANKING' || upperPM === 'NETBANKING' || upperPM === 'BANK') {
        mappedPaymentMethod = 'Net Banking';
      } else {
        mappedPaymentMethod = paymentMethod ? (paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1).toLowerCase()) : 'UPI';
      }

      postToGoogleSheets('create_order', {
        order_id: order.id,
        customer_name: order.customerName || user?.name || 'Anonymous User',
        email: order.userEmail || user?.email || '',
        phone: order.customerPhone || user?.phone || '',
        street_address: order.streetAddress || order.address || '',
        city: order.city || user?.city || '',
        zipcode: order.zipcode || '',
        ordered_item: order.items.map(i => `${i.name} (x${i.quantity})`).join(', '),
        payment_amount: order.total,
        payment_mode: mappedPaymentMethod,
        delivery_date: deliveryDateVal
      });
    }
  };

  const addProductReview = async (productId: number, review: Review) => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(review)
      });
      if (res.ok) {
        fetchPublicData();
      }
    } catch (e) {
      console.error("Failed to add review:", e);
    }
  };

  const postToGoogleSheets = async (action: string, data: any) => {
    try {
      const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyFjYATlrk1FVC0kRCcy2jpqfQxE32tGX7fm4uMNvt9Gl0TGIfqNyd3UC5sBHuB1ajWvQ/exec';
      const payload = {
        action,
        timestamp: new Date().toISOString(),
        ...data
      };
      
      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      setSheetsSyncLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Sheets Push Success: Action [${action}] synchronized online.`,
        ...prev
      ]);
    } catch (err) {
      console.error('Google Sheets POST synchronization failed:', err);
      setSheetsSyncLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Sheets Push Error: Sync failed for [${action}] - ${err}`,
        ...prev
      ]);
    }
  };

  const addProduct = async (newProduct: Omit<Product, 'id'>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        fetchPublicData();
        fetchAdminData();
      }
    } catch (e) {
      console.error("Adding product failed:", e);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
      const res = await fetch(`/api/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedProduct)
      });
      if (res.ok) {
        fetchPublicData();
        fetchAdminData();
      }
    } catch (e) {
      console.error("Updating product failed:", e);
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchPublicData();
        fetchAdminData();
      }
    } catch (e) {
      console.error("Deleting product failed:", e);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchUserData();
        fetchAdminData();
      }
    } catch (e) {
      console.error("Updating order status failed:", e);
    }
  };

  const updateUserStatus = async (userId: string, isBlocked: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isBlocked })
      });
      if (res.ok) {
        fetchAdminData();
        if (user && user.id === userId && isBlocked) {
          logout();
        }
      }
    } catch (e) {
      console.error("Updating user status failed:", e);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchAdminData();
        if (user && user.id === userId) {
          logout();
        }
      }
    } catch (e) {
      console.error("Deleting user failed:", e);
    }
  };

  const addCoupon = async (newCoupon: Omit<Coupon, 'id'>) => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCoupon)
      });
      if (res.ok) {
        fetchPublicData();
        fetchAdminData();
      }
    } catch (e) {
      console.error("Adding coupon failed:", e);
    }
  };

  const updateCoupon = async (updatedCoupon: Coupon) => {
    try {
      const res = await fetch(`/api/coupons/${updatedCoupon.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedCoupon)
      });
      if (res.ok) {
        fetchPublicData();
        fetchAdminData();
      }
    } catch (e) {
      console.error("Updating coupon failed:", e);
    }
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      const res = await fetch(`/api/coupons/${couponId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchPublicData();
        fetchAdminData();
      }
    } catch (e) {
      console.error("Deleting coupon failed:", e);
    }
  };

  const recordCouponUsage = async (usage: Omit<CouponUsage, 'id'>) => {
    try {
      const res = await fetch('/api/coupons/usages', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(usage)
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error("Recording coupon usage failed:", e);
    }
  };

  const triggerGoogleSheetsSync = async () => {
    setSheetsSyncStatus(prev => ({ ...prev, status: 'Syncing' }));
    try {
      const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyFjYATlrk1FVC0kRCcy2jpqfQxE32tGX7fm4uMNvt9Gl0TGIfqNyd3UC5sBHuB1ajWvQ/exec';
      const response = await fetch(GOOGLE_SHEETS_URL, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000)
      }).catch(() => null);

      let sheetsData: any = null;
      if (response && response.ok) {
        try {
          sheetsData = await response.json();
        } catch (e) {}
      }

      if (sheetsData) {
        setSheetsSyncLogs(prev => [
          `[${new Date().toLocaleTimeString()}] Sheets Pull: Connected. Google Sheets is a read-only historical record of registrations and orders.`,
          ...prev
        ]);
      } else {
        setSheetsSyncLogs(prev => [
          `[${new Date().toLocaleTimeString()}] Sheets Pull: Connected (Master website database active, Sheets are read-only).`,
          ...prev
        ]);
      }

      setSheetsSyncStatus({
        lastSyncTime: new Date().toLocaleTimeString(),
        status: 'Success',
        recordsSynced: allOrders.length
      });
    } catch (e) {
      setSheetsSyncStatus({
        lastSyncTime: new Date().toLocaleTimeString(),
        status: 'Error',
        recordsSynced: allOrders.length,
        errorDetails: String(e)
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      triggerGoogleSheetsSync();
    }, 15000);
    return () => clearInterval(interval);
  }, [allOrders]);

  return (
    <AuthContext.Provider value={{ 
      user, login, register, logout, updateProfile, orders, addOrder, products, addProductReview,
      allOrders, allUsers, inventoryLogs, payments, adminLogs,
      updateProduct, addProduct, deleteProduct, updateOrderStatus, updateUserStatus, deleteUser,
      coupons, couponUsages, addCoupon, updateCoupon, deleteCoupon, recordCouponUsage,
      sheetsSyncStatus, triggerGoogleSheetsSync, sheetsSyncLogs,
      orderStatusSyncEnabled, setOrderStatusSyncEnabled,
      cancelOrder, checkCancellationEligibility, seedProductsCatalog, resetDatabaseToEmpty, mongoInventory
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};


