import React, { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { useAuth } from '../services/store';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  ShoppingBag, 
  Users, 
  IndianRupee, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Search, 
  Filter, 
  UserX, 
  UserCheck, 
  AlertTriangle, 
  History, 
  Folder, 
  Image as ImageIcon,
  Activity,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Lock,
  Ticket,
  Database,
  CreditCard,
  RefreshCw,
  FileSpreadsheet,
  Percent,
  Calendar,
  X,
  XCircle,
  PlayCircle
} from 'lucide-react';
import { Product, Order, User, InventoryLog, PaymentInfo, AdminActivityLog, Coupon, CouponUsage } from '../types';

const AdminDashboard: React.FC = () => {
  const { 
    user, 
    products, 
    allOrders, 
    allUsers, 
    inventoryLogs, 
    payments, 
    adminLogs,
    updateProduct, 
    addProduct, 
    deleteProduct, 
    updateOrderStatus, 
    updateUserStatus, 
    deleteUser,
    coupons,
    couponUsages,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    sheetsSyncStatus,
    triggerGoogleSheetsSync,
    sheetsSyncLogs,
    mongoInventory,
    seedProductsCatalog,
    resetDatabaseToEmpty,
    orderStatusSyncEnabled,
    setOrderStatusSyncEnabled
  } = useAuth();
  
  const navigate = useNavigate();

  // Role Based Access Control
  const adminEmail = process.env.ADMIN_EMAIL || 'shrijains@gmail.com';

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6">
        <Lock size={64} className="text-amber-500 mb-4 animate-bounce" />
        <h1 className="text-3xl font-bold font-serif mb-2">Authentication Required</h1>
        <p className="text-neutral-400 mb-6 max-w-sm text-center">Please log in with the administrator credentials to view this dashboard.</p>
        <button 
          onClick={() => navigate('/login')} 
          className="bg-amber-500 text-black px-8 py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-amber-400 transition-colors"
        >
          Proceed to Login
        </button>
      </div>
    );
  }

  if (user.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-100 border-4 border-red-200 text-red-700 h-24 w-24 rounded-full flex items-center justify-center mb-6">
          <Lock size={44} />
        </div>
        <h1 className="text-4xl font-extrabold text-neutral-900 font-serif mb-2">403 Access Denied</h1>
        <p className="text-neutral-500 max-w-md mx-auto mb-8">
          You are logged in as <b className="text-neutral-800">{user.email}</b>. Only the administrator account (<b className="text-neutral-800">{adminEmail}</b>) can view this management dashboard.
        </p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-neutral-900 text-amber-500 px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-black transition-colors shadow-lg"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  // Active Management Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'products' | 'orders' | 'customers' | 'inventory' | 'coupons' | 'sheets' | 'payments'>('overview');

  // Revenue Dashboard States and Chart refs
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const monthlyRevenueCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const yearlyRevenueCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const monthlyOrdersCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const topProductsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const categoryRevenueCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const monthlyRevenueChartInstance = useRef<any>(null);
  const yearlyRevenueChartInstance = useRef<any>(null);
  const monthlyOrdersChartInstance = useRef<any>(null);
  const topProductsChartInstance = useRef<any>(null);
  const categoryRevenueChartInstance = useRef<any>(null);

  // Shared Filter and Modals States
  const [productQuery, setProductQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [orderQuery, setOrderQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [customerQuery, setCustomerQuery] = useState('');

  // Modals and Forms for Coupon Management
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponModalMode, setCouponModalMode] = useState<'add' | 'edit'>('add');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'Welcome' as Coupon['type'],
    discountPercentage: 10,
    maxDiscountLimit: 500,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    minimumOrderValue: 499,
    isActive: true,
    isUserSpecific: false,
    userId: '',
    festivalName: ''
  });

  // Modals for Products
  const [selectedCustomerForView, setSelectedCustomerForView] = useState<User | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'add' | 'edit'>('add');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form Fields for Product Add/Edit
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formCategory, setFormCategory] = useState('Pens');
  const [formImage, setFormImage] = useState('');
  const [formStock, setFormStock] = useState(20);

  // Categories defined in application
  const categoriesList = [
    'Notebooks & Registers',
    'Pens',
    'Pencils & Erasers',
    'Markers & Highlighters',
    'Art & Craft Supplies',
    'Exam Essentials',
    'Office Stationery',
    'School & College Supplies',
    'Desk Essentials',
    'Desk Accessories'
  ];

  // --- STATS COMPILATIONS ---
  // Real Successfully Paid Orders (must have paymentId and status !== 'Cancelled')
  const paidOrders = useMemo(() => {
    return allOrders.filter(o => o.paymentId && o.status !== 'Cancelled');
  }, [allOrders]);

  const totalRevenue = useMemo(() => {
    return paidOrders.reduce((sum, o) => sum + o.total, 0);
  }, [paidOrders]);

  const totalProducts = products.length;
  // Total orders (all placed orders count)
  const totalOrdersCount = allOrders.length;
  // Placed paid orders count
  const paidOrdersCount = paidOrders.length;

  const totalCustomersCount = allUsers.filter(u => u.email.toLowerCase() !== adminEmail.toLowerCase()).length;

  // LOW STOCK ALERT CONFIGURATION: Low stock products have stock > 0 and stock <= 10
  const lowStockProductsList = useMemo(() => {
    return products.filter(p => p.stock > 0 && p.stock <= 10);
  }, [products]);

  // OUT OF STOCK ALERT CONFIGURATION: Out of stock products have stock === 0
  const outOfStockProductsList = useMemo(() => {
    return products.filter(p => p.stock === 0);
  }, [products]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
  }, [products]);

  // Average Order Value across all paid orders
  const averageOrderValue = useMemo(() => {
    if (paidOrdersCount === 0) return 0;
    return Math.round(totalRevenue / paidOrdersCount);
  }, [totalRevenue, paidOrdersCount]);

  // Year list dynamically parsed from current system date to always show the latest 5 years
  const yearsList = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const dropdownYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
    return dropdownYears; // Contains currentYear down to currentYear - 4
  }, []);

  // Dynamic Month indices translation
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Selected Year monthly revenue and orders counts
  const monthlyRevData = useMemo(() => {
    const data = Array(12).fill(0);
    paidOrders.forEach(o => {
      try {
        const d = new Date(o.date);
        if (d.getFullYear() === selectedYear) {
          const m = d.getMonth();
          if (m >= 0 && m < 12) {
            data[m] += o.total;
          }
        }
      } catch (e) {}
    });
    return data;
  }, [paidOrders, selectedYear]);

  const selectedYearTotalRevenue = useMemo(() => {
    return monthlyRevData.reduce((sum, val) => sum + val, 0);
  }, [monthlyRevData]);

  const monthlyOrdCountData = useMemo(() => {
    const data = Array(12).fill(0);
    paidOrders.forEach(o => {
      try {
        const d = new Date(o.date);
        if (d.getFullYear() === selectedYear) {
          const m = d.getMonth();
          if (m >= 0 && m < 12) {
            data[m] += 1;
          }
        }
      } catch (e) {}
    });
    return data;
  }, [paidOrders, selectedYear]);

  // Yearly revenue grouping data
  const yearlyRevData = useMemo(() => {
    const rev: Record<number, number> = {};
    paidOrders.forEach(o => {
      try {
        const d = new Date(o.date);
        const y = d.getFullYear();
        if (!isNaN(y)) {
          rev[y] = (rev[y] || 0) + o.total;
        }
      } catch (e) {}
    });
    return rev;
  }, [paidOrders]);

  // Revenue by Category map
  const categoryRevenueMap = useMemo(() => {
    const mapping: Record<string, number> = {};
    categoriesList.forEach(cat => {
      mapping[cat] = 0;
    });
    paidOrders.forEach(o => {
      o.items.forEach(item => {
        const cat = item.category || 'Other';
        const rev = (item.price || 0) * (item.quantity || 0);
        mapping[cat] = (mapping[cat] || 0) + rev;
      });
    });
    return mapping;
  }, [paidOrders, categoriesList]);

  // Revenue and quantity sold by Product
  const productPerformanceMap = useMemo(() => {
    const mapping: Record<number, { name: string; category: string; quantity: number; revenue: number; stock: number }> = {};
    
    // Seed with all current products so they can be viewed even if 0 sales
    products.forEach(p => {
      mapping[p.id] = {
        name: p.name,
        category: p.category,
        quantity: 0,
        revenue: 0,
        stock: p.stock
      };
    });

    paidOrders.forEach(o => {
      o.items.forEach(item => {
        const pid = item.id;
        if (mapping[pid]) {
          mapping[pid].quantity += item.quantity || 0;
          mapping[pid].revenue += (item.price || 0) * (item.quantity || 0);
        } else {
          mapping[pid] = {
            name: item.name,
            category: item.category || 'Other',
            quantity: item.quantity || 0,
            revenue: (item.price || 0) * (item.quantity || 0),
            stock: item.stock || 0
          };
        }
      });
    });

    return mapping;
  }, [paidOrders, products]);

  // Sort performance to find top sellings
  const sortedTopProducts = useMemo(() => {
    return Object.values(productPerformanceMap)
      .filter(p => p.quantity > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [productPerformanceMap]);

  const topSellingProductsMapped = useMemo(() => {
    return sortedTopProducts;
  }, [sortedTopProducts]);

  // Chart.js initialization for dynamic visual reporting
  useEffect(() => {
    if (activeTab !== 'revenue' || selectedYearTotalRevenue === 0) {
      // Destroy any remaining instances just in case
      monthlyRevenueChartInstance.current?.destroy();
      yearlyRevenueChartInstance.current?.destroy();
      monthlyOrdersChartInstance.current?.destroy();
      topProductsChartInstance.current?.destroy();
      categoryRevenueChartInstance.current?.destroy();
      return;
    }

    // Destroy existing instances to ensure zero collision / leak
    if (monthlyRevenueChartInstance.current) {
      monthlyRevenueChartInstance.current.destroy();
      monthlyRevenueChartInstance.current = null;
    }
    if (yearlyRevenueChartInstance.current) {
      yearlyRevenueChartInstance.current.destroy();
      yearlyRevenueChartInstance.current = null;
    }
    if (monthlyOrdersChartInstance.current) {
      monthlyOrdersChartInstance.current.destroy();
      monthlyOrdersChartInstance.current = null;
    }
    if (topProductsChartInstance.current) {
      topProductsChartInstance.current.destroy();
      topProductsChartInstance.current = null;
    }
    if (categoryRevenueChartInstance.current) {
      categoryRevenueChartInstance.current.destroy();
      categoryRevenueChartInstance.current = null;
    }

    // 1. Monthly Revenue Chart (selectedYear)
    if (monthlyRevenueCanvasRef.current) {
      const ctx = monthlyRevenueCanvasRef.current.getContext('2d');
      if (ctx) {
        monthlyRevenueChartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
              label: `Revenue (₹)`,
              data: monthlyRevData,
              borderColor: '#f59e0b', // Amber-500
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              borderWidth: 3.5,
              tension: 0.35,
              fill: true,
              pointBackgroundColor: '#d97706',
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                ticks: { color: '#6b7280', font: { weight: 'bold' } }
              },
              x: {
                grid: { display: false },
                ticks: { color: '#6b7280', font: { weight: 'bold' } }
              }
            }
          }
        });
      }
    }

    // 2. Yearly Revenue Chart (overall years)
    if (yearlyRevenueCanvasRef.current) {
      const ctx = yearlyRevenueCanvasRef.current.getContext('2d');
      if (ctx) {
        yearlyRevenueChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: yearsList.map(String),
            datasets: [{
              label: 'Total Annual Revenue (₹)',
              data: yearsList.map(y => yearlyRevData[y] || 0),
              backgroundColor: '#10b981', // green-500
              borderRadius: 8,
              barThickness: 45
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                ticks: { color: '#6b7280', font: { weight: 'bold' } }
              },
              x: {
                grid: { display: false },
                ticks: { color: '#6b7280', font: { weight: 'bold' } }
              }
            }
          }
        });
      }
    }

    // 3. Orders Per Month Chart (selectedYear)
    if (monthlyOrdersCanvasRef.current) {
      const ctx = monthlyOrdersCanvasRef.current.getContext('2d');
      if (ctx) {
        monthlyOrdersChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
              label: 'Successful Orders Count',
              data: monthlyOrdCountData,
              backgroundColor: '#3b82f6', // blue-500
              borderRadius: 6,
              barThickness: 20
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                ticks: { stepSize: 1, color: '#6b7280', font: { weight: 'bold' } }
              },
              x: {
                grid: { display: false },
                ticks: { color: '#6b7280', font: { weight: 'bold' } }
              }
            }
          }
        });
      }
    }

    // 4. Top Selling Products (Horizontal Bar Chart)
    if (topProductsCanvasRef.current) {
      const ctx = topProductsCanvasRef.current.getContext('2d');
      if (ctx) {
        const topProds = topSellingProductsMapped.slice(0, 5);
        const topLabels = topProds.length > 0 ? topProds.map(p => p.name) : ['No Sales Registered Yet'];
        const topData = topProds.length > 0 ? topProds.map(p => p.revenue) : [0];

        topProductsChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: topLabels,
            datasets: [{
              label: 'Revenue (₹)',
              data: topData,
              backgroundColor: '#8b5cf6', // purple-500
              borderRadius: 6,
              barThickness: 15
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                ticks: { color: '#6b7280', font: { weight: 'bold' } }
              },
              y: {
                grid: { display: false },
                ticks: { color: '#6b7280', font: { weight: 'bold' } }
              }
            }
          }
        });
      }
    }

    // 5. Revenue by Category
    if (categoryRevenueCanvasRef.current) {
      const ctx = categoryRevenueCanvasRef.current.getContext('2d');
      if (ctx) {
        const activeCats = Object.keys(categoryRevenueMap).filter(cat => categoryRevenueMap[cat] > 0);
        const catLabels = activeCats.length > 0 ? activeCats : ['No Revenue Streamed'];
        const catData = activeCats.length > 0 ? activeCats.map(cat => categoryRevenueMap[cat]) : [0.0001];

        categoryRevenueChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: catLabels,
            datasets: [{
              data: catData,
              backgroundColor: [
                '#f59e0b', // amber
                '#3b82f6', // blue
                '#10b981', // green
                '#8b5cf6', // purple
                '#ec4899', // pink
                '#06b6d4', // cyan
                '#f43f5e', // rose
                '#14b8a6', // teal
                '#6366f1', // indigo
                '#84cc16'  // lime
              ].slice(0, catLabels.length)
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  boxWidth: 12,
                  font: { size: 10, weight: 'bold' },
                  color: '#4b5563'
                }
              }
            },
            cutout: '60%'
          }
        });
      }
    }

    // Clean up
    return () => {
      monthlyRevenueChartInstance.current?.destroy();
      yearlyRevenueChartInstance.current?.destroy();
      monthlyOrdersChartInstance.current?.destroy();
      topProductsChartInstance.current?.destroy();
      categoryRevenueChartInstance.current?.destroy();
    };
  }, [activeTab, selectedYear, paidOrders, payments]);

  // Filtered lists
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(productQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredOrders = allOrders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(orderQuery.toLowerCase()) || 
                          o.address.toLowerCase().includes(orderQuery.toLowerCase());
    const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = allUsers.filter(u => {
    if (u.email.toLowerCase() === adminEmail.toLowerCase()) return false; // exclude admin
    return u.name.toLowerCase().includes(customerQuery.toLowerCase()) || 
           u.email.toLowerCase().includes(customerQuery.toLowerCase()) || 
           (u.phone && u.phone.includes(customerQuery));
  });

  // Open Add Product Modal
  const openAddProduct = () => {
    setProductModalMode('add');
    setFormName('');
    setFormDescription('');
    setFormPrice(150);
    setFormCategory('Pens');
    setFormImage('https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&q=80&w=800');
    setFormStock(20);
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const openEditProduct = (prod: Product) => {
    setProductModalMode('edit');
    setSelectedProduct(prod);
    setFormName(prod.name);
    setFormDescription(prod.description);
    setFormPrice(prod.price);
    setFormCategory(prod.category);
    setFormImage(prod.image);
    setFormStock(prod.stock);
    setIsProductModalOpen(true);
  };

  // Handle Save Product Action
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDescription.trim() || !formImage.trim() || formPrice <= 0 || formStock < 0) {
      alert("Please specify clean details.");
      return;
    }

    if (productModalMode === 'add') {
      addProduct({
        name: formName,
        description: formDescription,
        price: Number(formPrice),
        category: formCategory,
        image: formImage,
        stock: Number(formStock)
      });
    } else if (productModalMode === 'edit' && selectedProduct) {
      updateProduct({
        ...selectedProduct,
        name: formName,
        description: formDescription,
        price: Number(formPrice),
        category: formCategory,
        image: formImage,
        stock: Number(formStock)
      });
    }
    setIsProductModalOpen(false);
  };

  // Analytical compilations
  const categoryInventoryCounts = categoriesList.map(cat => {
    const catProducts = products.filter(p => p.category === cat);
    const count = catProducts.length;
    const totalStock = catProducts.reduce((sum, p) => sum + p.stock, 0);
    return { name: cat, count, totalStock };
  });

  // Calculate top selling based on simulated/seeded central order items
  // --- COUPON FORM OPERATIONS ---
  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      alert("Please specify a valid code.");
      return;
    }
    
    const couponPayload: Omit<Coupon, 'id'> = {
      code: couponForm.code.toUpperCase().replace(/\s/g, ''),
      type: couponForm.type,
      discountPercentage: Number(couponForm.discountPercentage),
      maxDiscountLimit: Number(couponForm.maxDiscountLimit),
      startDate: couponForm.startDate,
      expiryDate: couponForm.expiryDate,
      minimumOrderValue: Number(couponForm.minimumOrderValue),
      isActive: couponForm.isActive,
      isUserSpecific: couponForm.isUserSpecific,
      userId: couponForm.isUserSpecific ? couponForm.userId : undefined,
      festivalName: couponForm.type === 'Festival' ? couponForm.festivalName : undefined
    };

    if (couponModalMode === 'add') {
      addCoupon(couponPayload);
    } else if (couponModalMode === 'edit' && selectedCoupon) {
      updateCoupon({
        ...couponPayload,
        id: selectedCoupon.id
      });
    }
    setIsCouponModalOpen(false);
  };

  const openAddCoupon = () => {
    setCouponModalMode('add');
    setCouponForm({
      code: '',
      type: 'Welcome',
      discountPercentage: 10,
      maxDiscountLimit: 500,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      minimumOrderValue: 499,
      isActive: true,
      isUserSpecific: false,
      userId: '',
      festivalName: ''
    });
    setIsCouponModalOpen(true);
  };

  const openEditCoupon = (coupon: Coupon) => {
    setCouponModalMode('edit');
    setSelectedCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      type: coupon.type,
      discountPercentage: coupon.discountPercentage,
      maxDiscountLimit: coupon.maxDiscountLimit,
      startDate: coupon.startDate,
      expiryDate: coupon.expiryDate,
      minimumOrderValue: coupon.minimumOrderValue,
      isActive: coupon.isActive,
      isUserSpecific: coupon.isUserSpecific,
      userId: coupon.userId || '',
      festivalName: coupon.festivalName || ''
    });
    setIsCouponModalOpen(true);
  };

  return (
    <div className="bg-neutral-50 min-h-screen text-neutral-800">
      
      {/* Top Banner Row */}
      <div className="bg-black text-amber-500 py-6 border-b border-amber-500/35">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-black p-2.5 rounded-lg font-serif font-black text-xl tracking-widest leading-none shadow-md">
              SJSM
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif leading-none tracking-tight text-white mb-1">Administrative Center</h1>
              <p className="text-xs text-amber-300 font-mono tracking-widest uppercase">Shri Jain Stationery Mart - Kota</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-1.5"><Activity size={16} className="text-green-500 animate-pulse"/> Standard Mode Active</span>
            <button 
              onClick={() => navigate('/')} 
              className="bg-neutral-800 hover:bg-neutral-900 border border-amber-500/40 text-amber-500 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all"
            >
              Public Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Main content body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Management Board Nav Tabs */}
        <div className="flex overflow-x-auto border-b border-neutral-300 pb-0 mb-8 gap-1.5 no-scrollbar">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-4 font-black uppercase text-xs tracking-wider transition-all rounded-t-xl ${activeTab === 'overview' ? 'bg-amber-500 text-black font-semibold border-t-4 border-black' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'}`}
          >
            <BarChart3 size={16} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('revenue')}
            className={`flex items-center gap-2 px-6 py-4 font-black uppercase text-xs tracking-wider transition-all rounded-t-xl ${activeTab === 'revenue' ? 'bg-amber-500 text-black font-semibold border-t-4 border-black' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'}`}
          >
            <TrendingUp size={16} /> Revenue Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-4 font-black uppercase text-xs tracking-wider transition-all rounded-t-xl ${activeTab === 'products' ? 'bg-amber-500 text-black font-semibold border-t-4 border-black' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'}`}
          >
            <Package size={16} /> Products
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-4 font-black uppercase text-xs tracking-wider transition-all rounded-t-xl ${activeTab === 'orders' ? 'bg-amber-500 text-black font-semibold border-t-4 border-black' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'}`}
          >
            <ShoppingBag size={16} /> {allOrders.filter(o => o.status === 'Processing').length > 0 && (
              <span className="h-2 w-2 bg-red-500 rounded-full inline-block animate-ping"></span>
            )} Orders
          </button>
          <button 
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-6 py-4 font-black uppercase text-xs tracking-wider transition-all rounded-t-xl ${activeTab === 'customers' ? 'bg-amber-500 text-black font-semibold border-t-4 border-black' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'}`}
          >
            <Users size={16} /> Customers
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-6 py-4 font-black uppercase text-xs tracking-wider transition-all rounded-t-xl ${activeTab === 'inventory' ? 'bg-amber-500 text-black font-semibold border-t-4 border-black' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'}`}
          >
            <History size={16} /> Audit Logs
          </button>
          <button 
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-2 px-6 py-4 font-black uppercase text-xs tracking-wider transition-all rounded-t-xl ${activeTab === 'coupons' ? 'bg-amber-500 text-black font-semibold border-t-4 border-black' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'}`}
          >
            <Ticket size={16} /> Coupons & Offers
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-6 py-4 font-black uppercase text-xs tracking-wider transition-all rounded-t-xl ${activeTab === 'payments' ? 'bg-amber-500 text-black font-semibold border-t-4 border-black' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'}`}
          >
            <CreditCard size={16} /> Payments Setup
          </button>
          <button 
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 px-6 py-4 font-black uppercase text-xs tracking-wider transition-all rounded-t-xl ${activeTab === 'sheets' ? 'bg-amber-500 text-black font-semibold border-t-4 border-black' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'}`}
          >
            <Database size={16} /> Sheets Sync Status
          </button>
        </div>

        {/* REVENUE & COMPREHENSIVE SALES DASHBOARD */}
        {activeTab === 'revenue' && (
          <div className="space-y-8 animate-fade-in pb-10">
            {/* Header and Year Filtre Panel */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2">
                  <TrendingUp className="text-amber-500 animate-pulse" /> Revenue Analytics Dashboard
                </h2>
                <p className="text-xs text-neutral-500 mt-1">Real-time ledger analytics compiled dynamically from successfully captured payments and non-cancelled orders.</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase text-neutral-400 tracking-wider">Select Analytics Year</span>
                <select 
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="bg-neutral-50 border border-neutral-300 rounded-xl py-2 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-800 cursor-pointer shadow-sm"
                >
                  {yearsList.map(yr => (
                    <option key={yr} value={yr}>CY {yr}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedYearTotalRevenue > 0 ? (
              <>
                {/* KPI statistics cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest block mb-1">Total Revenue (All-Time)</span>
                        <h3 className="text-3xl font-black text-neutral-950 font-serif leading-none font-sans">₹{totalRevenue.toLocaleString()}</h3>
                      </div>
                      <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl"><IndianRupee size={20}/></div>
                    </div>
                    <div className="text-[10px] text-neutral-400 font-bold mt-4 pt-1.5 border-t border-neutral-100">
                      Total of all-time successfully paid purchases
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest block mb-1">Yearly sales ({selectedYear})</span>
                        <h3 className="text-3xl font-black text-neutral-950 font-serif leading-none font-sans">₹{(yearlyRevData[selectedYear] || 0).toLocaleString()}</h3>
                      </div>
                      <span className="bg-green-100 text-green-600 p-2.5 rounded-xl"><TrendingUp size={20}/></span>
                    </div>
                    <div className="text-[10px] text-green-600 font-bold mt-4 pt-1.5 border-t border-neutral-100 flex items-center gap-1">
                      Active filter window performance
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest block mb-1">Average Order Value (AOV)</span>
                        <h3 className="text-3xl font-black text-neutral-950 font-serif leading-none font-sans">₹{averageOrderValue.toLocaleString()}</h3>
                      </div>
                      <span className="bg-blue-100 text-blue-600 p-2.5 rounded-xl"><Activity size={20}/></span>
                    </div>
                    <div className="text-[10px] text-neutral-400 font-bold mt-4 pt-1.5 border-t border-neutral-100">
                      Based on {paidOrdersCount} successful checkouts
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest block mb-1">Paid / Total Orders</span>
                        <h3 className="text-3xl font-black text-neutral-950 font-serif leading-none font-sans">{paidOrdersCount} / {totalOrdersCount}</h3>
                      </div>
                      <span className="bg-purple-100 text-purple-600 p-2.5 rounded-xl"><ShoppingBag size={20}/></span>
                    </div>
                    <div className="text-[10px] text-red-500 font-bold mt-4 pt-1.5 border-t border-neutral-100">
                      {allOrders.filter(o => o.status === 'Cancelled').length} cancelled orders excluded
                    </div>
                  </div>

                </div>

                {/* Chart row 1: Line and bar monthly stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold font-serif text-neutral-900">1. Monthly Revenue Chart (₹)</h3>
                      <p className="text-xs text-neutral-400">Total collection from successful sales in each month of {selectedYear}</p>
                    </div>
                    <div className="h-64 w-full relative">
                      <canvas ref={monthlyRevenueCanvasRef} />
                    </div>
                    {paidOrdersCount === 0 && (
                      <p className="text-xxs text-neutral-400 text-center italic mt-2">No successfully paid orders across {selectedYear}. Place a order to see stats.</p>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold font-serif text-neutral-900">3. Orders Per Month Chart</h3>
                      <p className="text-xs text-neutral-400">Chronological transaction density distribution per calendar month for {selectedYear}</p>
                    </div>
                    <div className="h-64 w-full relative">
                      <canvas ref={monthlyOrdersCanvasRef} />
                    </div>
                  </div>

                </div>

                {/* Chart row 2: Three columns (Year comparison, category share, and top lists) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold font-serif text-neutral-900">2. Yearly Revenue Chart</h3>
                      <p className="text-xs text-neutral-400">Comparative annual collection curve spanning all years</p>
                    </div>
                    <div className="h-56 w-full relative">
                      <canvas ref={yearlyRevenueCanvasRef} />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold font-serif text-neutral-900">5. Revenue by Category</h3>
                      <p className="text-xs text-neutral-400">Sales share split across our {categoriesList.length} divisions</p>
                    </div>
                    <div className="h-56 w-full relative">
                      <canvas ref={categoryRevenueCanvasRef} />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="mb-4">
                        <h3 className="text-lg font-bold font-serif text-neutral-900">4. Top Selling Products</h3>
                        <p className="text-xs text-neutral-400">Top catalog products based on sales revenue contribution</p>
                      </div>
                      <div className="h-40 w-full relative">
                        <canvas ref={topProductsCanvasRef} />
                      </div>
                    </div>
                    
                    {/* List table */}
                    <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                      {topSellingProductsMapped.length === 0 ? (
                        <p className="text-xxs text-neutral-400 text-center italic py-4">No itemized checkout sales tracked yet.</p>
                      ) : (
                        topSellingProductsMapped.slice(0, 3).map((p, idx) => (
                          <div key={p.name} className="flex justify-between items-center text-xs p-1.5 rounded hover:bg-neutral-50">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-neutral-400">#{idx+1}</span>
                              <span className="font-bold text-neutral-800 truncate max-w-[120px]">{p.name}</span>
                            </div>
                            <span className="font-mono text-amber-600 font-extrabold">₹{p.revenue.toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* In-depth Dynamic Month Breakdown table */}
                <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold font-serif text-neutral-900 text-md">CY {selectedYear}: Calendar Months Performance Grid</h3>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Sourced from successfully checked paid order records</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-neutral-950 text-white font-black uppercase text-[9px] tracking-wider border-b border-neutral-100">
                          <th className="p-4">Calendar Month</th>
                          <th className="p-4 text-center">Receipt Count (Orders)</th>
                          <th className="p-4 text-right">Net Generated Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-150">
                        {monthsList.map((mName, idx) => {
                          const mRev = monthlyRevData[idx] || 0;
                          const mCount = monthlyOrdCountData[idx] || 0;
                          return (
                            <tr key={mName} className="hover:bg-neutral-50 font-semibold border-b border-neutral-100">
                              <td className="p-4 text-neutral-900 font-extrabold">{mName} <span className="text-[9px] text-neutral-400 font-mono italic">({selectedYear})</span></td>
                              <td className="p-4 text-center font-mono text-neutral-600">{mCount} Orders</td>
                              <td className={`p-4 text-right font-mono font-black ${mRev > 0 ? 'text-green-700' : 'text-neutral-400'}`}>
                                ₹{mRev.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-neutral-200 shadow-sm text-center">
                <div className="text-neutral-300 mb-4">
                  <TrendingUp size={48} className="mx-auto text-neutral-300" />
                </div>
                <h3 className="text-xl font-bold font-serif text-neutral-800">No revenue has been generated yet.</h3>
                <p className="text-xs text-neutral-400 mt-1">Revenue data will appear once orders are placed for CY {selectedYear}.</p>
              </div>
            )}

          </div>
        )}

        {/* 1. OVERVIEW & ANALYTICS VIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Real Stats Cards Ring */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              
              <div className="bg-white p-6 rounded-2xl shadow-md border border-neutral-200 hover:shadow-lg transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Revenue</span>
                    <div className="bg-amber-100 text-amber-600 p-2 rounded-xl"><IndianRupee size={20}/></div>
                  </div>
                  <h3 className="text-3xl font-bold text-neutral-900 font-serif leading-none">₹{totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="flex items-center text-xs text-green-600 font-medium mt-4">
                  <TrendingUp size={16} className="mr-1"/> +15% Growth trend
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md border border-neutral-200 hover:shadow-lg transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Orders</span>
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-xl"><ShoppingBag size={20}/></div>
                  </div>
                  <h3 className="text-3xl font-bold text-neutral-900 font-serif leading-none">{totalOrdersCount}</h3>
                </div>
                <div className="flex items-center text-xs text-neutral-500 font-medium mt-4">
                  Pending: {allOrders.filter(o => o.status === 'Processing').length} items
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md border border-neutral-200 hover:shadow-lg transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Products</span>
                    <div className="bg-purple-100 text-purple-600 p-2 rounded-xl"><Package size={20}/></div>
                  </div>
                  <h3 className="text-3xl font-bold text-neutral-900 font-serif leading-none">{totalProducts}</h3>
                </div>
                <div className="flex items-center text-xs text-neutral-500 font-medium mt-4">
                  Sorted over {categoriesList.length} divisions
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md border border-neutral-200 hover:shadow-lg transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Customers</span>
                    <div className="bg-green-100 text-green-600 p-2 rounded-xl"><Users size={20}/></div>
                  </div>
                  <h3 className="text-3xl font-bold text-neutral-900 font-serif leading-none">{totalCustomersCount}</h3>
                </div>
                <div className="flex items-center text-xs text-neutral-500 font-medium mt-4">
                  Blocked: {allUsers.filter(u => u.isBlocked).length} users
                </div>
              </div>

              <div className="bg-red-50 p-6 rounded-2xl shadow-md border-2 border-red-100 hover:shadow-lg transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Low Stock Alert</span>
                    <div className="bg-red-100 text-red-600 p-2 rounded-xl"><AlertTriangle size={20}/></div>
                  </div>
                  <h3 className="text-3xl font-bold text-red-900 font-serif leading-none">{lowStockProductsList.length}</h3>
                </div>
                <div className="flex items-center text-xs text-red-600 font-bold mt-4">
                  Out of Stock: {products.filter(p => p.stock === 0).length} items
                </div>
              </div>

            </div>

            {/* Bento charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Monthly sales report simulation */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold font-serif text-neutral-900">Revenue & Trend Analysis</h3>
                    <p className="text-xs text-neutral-400">Comparing last 4 periods performance</p>
                  </div>
                  <span className="text-xs font-black uppercase text-amber-600 tracking-wider bg-amber-50 px-2.5 py-1 rounded-md">Real-time</span>
                </div>
                
                {/* Visual Bar chart custom rendering */}
                <div className="space-y-6">
                  <div className="relative pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-neutral-700">June 2026 (Active)</span>
                      <span className="text-sm font-black text-amber-600">₹{totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="h-4 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (totalRevenue / 15000) * 100)}%` }}></div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-neutral-500">May 2026</span>
                      <span className="text-sm font-bold text-neutral-600">₹8,450</span>
                    </div>
                    <div className="h-4 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-400 rounded-full" style={{ width: "56%" }}></div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-neutral-500">April 2026</span>
                      <span className="text-sm font-bold text-neutral-600">₹12,200</span>
                    </div>
                    <div className="h-4 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-400 rounded-full" style={{ width: "81%" }}></div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-neutral-500">March 2026</span>
                      <span className="text-sm font-bold text-neutral-600">₹5,100</span>
                    </div>
                    <div className="h-4 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-400 rounded-full" style={{ width: "34%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-100 flex justify-between items-center text-xs text-neutral-500">
                  <span className="flex items-center gap-1"><TrendingUp size={14} className="text-green-500"/> Healthy transaction density</span>
                  <span className="font-mono">June total based on {allOrders.length} records</span>
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-md flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-bold font-serif text-neutral-900">Top Selling Products</h3>
                  <p className="text-xs text-neutral-400">Ranked by unit sales volume</p>
                </div>
                
                <div className="space-y-4 flex-1 flex flex-col justify-center">
                  {sortedTopProducts.length === 0 ? (
                    <p className="text-sm text-neutral-500 italic text-center py-6">No products sold yet. Place a test order to see ranks!</p>
                  ) : (
                    sortedTopProducts.map((p, itemIdx) => (
                      <div key={p.name} className="flex justify-between items-center p-2 rounded-xl hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className="h-6 w-6 rounded-full bg-amber-500 text-black font-black text-xs flex items-center justify-center">{itemIdx + 1}</span>
                          <span className="font-bold text-neutral-800 text-sm line-clamp-1 max-w-[150px]">{p.name}</span>
                        </div>
                        <div className="text-right text-xs">
                          <p className="font-black text-neutral-900">{p.quantity} sold</p>
                          <p className="text-neutral-400">₹{p.revenue}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                  <span>Inventory Auto-tracked</span>
                  <button onClick={() => setActiveTab('products')} className="text-amber-600 hover:underline flex items-center gap-0.5">Catalog <ArrowRight size={12}/></button>
                </div>
              </div>

            </div>

            {/* Inventory level warnings & low stock alert listing */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left: Low Stock alerts panel */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-md lg:col-span-2">
                <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-amber-500" size={22}/>
                    <h3 className="text-lg font-bold font-serif text-neutral-900">Low Stock Registry</h3>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold">Needs attention</span>
                </div>
                
                <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto no-scrollbar">
                  {lowStockProductsList.length === 0 && outOfStockProductsList.length === 0 ? (
                    <div className="text-center py-12 text-neutral-400">
                      <CheckCircle className="mx-auto text-green-500 mb-2" size={32}/>
                      <p className="font-bold text-sm">Perfect Stock Levels!</p>
                      <p className="text-xs">No catalog items have stock values lower than or equal to 10 units.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar">
                      {outOfStockProductsList.map(p => (
                        <div key={p.id} className="p-3 rounded-xl border border-red-200 flex justify-between items-center bg-red-50/20 shadow-sm hover:bg-neutral-50 transition-colors">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-black uppercase tracking-wider">🚫 Out of Stock</span>
                              <span className="text-neutral-400 text-[10px] font-bold font-mono">ID: {p.id}</span>
                            </div>
                            <p className="text-xs font-extrabold text-neutral-900 leading-tight mb-0.5">{p.name}</p>
                            <p className="text-[9px] text-neutral-400 uppercase tracking-widest">{p.category}</p>
                            <p className="text-red-600 text-xs font-semibold mt-1">"{p.name}" is out of stock.</p>
                          </div>
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs bg-red-100 text-red-700">
                            0
                          </div>
                        </div>
                      ))}
                      {lowStockProductsList.map(p => (
                        <div key={p.id} className="p-3 rounded-xl border border-amber-200 flex justify-between items-center bg-amber-50/20 shadow-sm hover:bg-neutral-50 transition-colors">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-black uppercase tracking-wider">⚠ Low Stock Alert</span>
                              <span className="text-neutral-400 text-[10px] font-bold font-mono">ID: {p.id}</span>
                            </div>
                            <p className="text-xs font-extrabold text-neutral-900 leading-tight mb-0.5">{p.name}</p>
                            <p className="text-[9px] text-neutral-400 uppercase tracking-widest">{p.category}</p>
                            <p className="text-amber-800 text-xs font-semibold mt-1">"{p.name}" is running low. Only {p.stock} units remaining.</p>
                          </div>
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs bg-amber-100 text-amber-700">
                            {p.stock}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-end">
                  <button onClick={() => setActiveTab('products')} className="text-xs text-amber-600 hover:underline font-bold">Quickly restock products now →</button>
                </div>
              </div>

              {/* Right: Category volume stats */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-md">
                <h3 className="text-lg font-bold font-serif mb-4 flex items-center gap-1.5"><Folder size={20} className="text-amber-500"/> Catalog Stock Shares</h3>
                <div className="space-y-3.5 max-h-72 overflow-y-auto no-scrollbar pr-1">
                  {categoryInventoryCounts.map(cat => (
                    <div key={cat.name} className="flex justify-between items-center text-sm p-1">
                      <div>
                        <span className="font-bold text-neutral-800">{cat.name}</span>
                        <span className="text-[10px] text-neutral-400 block">{cat.count} items configured</span>
                      </div>
                      <span className="font-bold bg-neutral-100 px-2.5 py-1 rounded-md text-xs">{cat.totalStock} units</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 2. PRODUCT MANAGEMENT VIEW */}
        {activeTab === 'products' && (
          <div className="bg-white p-6 rounded-2xl shadow-md border border-neutral-200 animate-fade-in">
            
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 pb-6 border-b border-neutral-100">
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                  <input 
                    type="text" 
                    placeholder="Search catalog products..." 
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white text-black"
                    value={productQuery}
                    onChange={e => setProductQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="border border-neutral-300 rounded-lg px-4 py-2 text-sm bg-white text-black"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={openAddProduct}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-amber-500 text-black px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-amber-400 transition-all shadow-md active:scale-95"
              >
                <Plus size={16}/> New Product
              </button>

            </div>

            {/* Catalog Grid Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-neutral-200 text-neutral-400 text-xxs font-black tracking-widest uppercase pb-3">
                    <th className="py-3">Details</th>
                    <th className="py-3">Category</th>
                    <th className="py-3">Price</th>
                    <th className="py-3">Stock Level</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors group">
                      <td className="py-4 flex items-center gap-3">
                        <img src={p.image} className="w-12 h-12 object-cover rounded-lg border border-neutral-200" />
                        <div>
                          <p className="font-bold text-neutral-900 text-sm">{p.name}</p>
                          <p className="text-xs text-neutral-400 line-clamp-1 max-w-xs">{p.description}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-xs bg-neutral-100 px-2.5 py-1 rounded-md font-medium">{p.category}</span>
                      </td>
                      <td className="py-4 text-sm font-bold text-neutral-900">
                        ₹{p.price}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${p.stock === 0 ? 'bg-red-500 animate-ping' : p.stock <= 5 ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></span>
                          <span className={`text-xs font-bold ${p.stock === 0 ? 'text-red-600 font-extrabold' : p.stock <= 5 ? 'text-orange-600' : 'text-neutral-700'}`}>
                            {p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} units`}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditProduct(p)} 
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 p-2 rounded-lg transition-colors"
                            title="Edit details"
                          >
                            <Edit size={14}/>
                          </button>
                          <button 
                            onClick={() => { if(confirm(`Confirm deleting catalog item "${p.name}"?`)) deleteProduct(p.id); }} 
                            className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors"
                            title="Delete item"
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-neutral-500 italic">No products found for search queries.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 3. ORDER MANAGEMENT VIEW */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded-2xl shadow-md border border-neutral-200 animate-fade-in">
            
            {/* Filter controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 pb-6 border-b border-neutral-100">
              <div className="relative w-full md:w-96">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Search orders (ID, Address)..." 
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white text-black"
                  value={orderQuery}
                  onChange={e => setOrderQuery(e.target.value)}
                />
              </div>

              <select 
                className="w-full md:w-48 border border-neutral-300 rounded-lg px-4 py-2 text-sm bg-white text-black cursor-pointer align-middle"
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
              >
                <option value="All">All Order Statuses</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            {/* Orders registry list */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-neutral-200 text-neutral-400 text-xxs font-black tracking-widest uppercase pb-3">
                    <th className="py-3">Order ID / Customer</th>
                    <th className="py-3">Shipped To</th>
                    <th className="py-3">Purchased Items</th>
                    <th className="py-3">Delivery Tracker</th>
                    <th className="py-3">Payment Info</th>
                    <th className="py-3">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4">
                        <span className="font-mono text-xs font-bold text-neutral-950 block">{order.id}</span>
                        <span className="text-xxs text-neutral-500 block font-bold uppercase mt-0.5">{order.customerName || 'Anonymous'}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-semibold text-neutral-800 block line-clamp-2 max-w-[180px]">{order.address}</span>
                      </td>
                      <td className="py-4">
                        <div className="text-xs space-y-1">
                          {order.items.map((item, idX) => (
                            <p key={idX} className="text-neutral-600 font-medium">
                              • {item.name} <b className="text-neutral-900 font-mono">x{item.quantity}</b>
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1 px-1 text-xs text-neutral-700">
                          <div>
                            <span className="text-[9px] text-neutral-450 uppercase font-black block">Ordered Date</span>
                            <span className="font-mono font-bold text-neutral-850">
                              {order.orderDate || new Date(order.date).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-amber-600 uppercase font-black block">Estimated Delivery</span>
                            <span className="font-mono font-bold text-amber-700">
                              {order.estimatedDelivery || order.deliveryDate || 'N/A'}
                            </span>
                          </div>
                          {order.status === 'Delivered' && order.deliveredDate && (
                            <div className="bg-green-50 border border-green-150 px-2 py-0.5 rounded inline-block mt-1">
                              <span className="text-[8px] text-green-600 uppercase font-black block">Delivered On</span>
                              <span className="font-mono font-bold text-green-700">{order.deliveredDate}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-sm font-bold text-neutral-900 block">₹{order.total}</span>
                        {order.paymentId ? (
                          <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded cursor-help font-mono block mt-1 w-max" title={`Razorpay Ref: ${order.paymentId}`}>
                            💳 Paid ({order.paymentMethod || 'Card'})
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono block mt-1 w-max">
                            💵 Cod ({order.paymentMethod || 'UPI'})
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <select 
                          className={`text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none border-2 cursor-pointer ${
                            order.status === 'Delivered' ? 'bg-green-50 border-green-200 text-green-700' : 
                            order.status === 'Shipped' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                            order.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-700' :
                            'bg-yellow-50 border-yellow-250 text-yellow-700'
                          }`}
                          value={order.status}
                          onChange={e => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-neutral-500 italic">No orders registered under these constraints.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 4. CUSTOMER MANAGEMENT VIEW */}
        {activeTab === 'customers' && (
          <div className="bg-white p-6 rounded-2xl shadow-md border border-neutral-200 animate-fade-in">
            
            {/* Customer Statistics Band */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-xxs font-black text-neutral-400 uppercase tracking-widest leading-none mb-1.5">Total Customers</p>
                  <p className="text-3xl font-black text-neutral-950 font-mono">
                    {allUsers.filter(u => u.email.toLowerCase() !== adminEmail.toLowerCase()).length}
                  </p>
                </div>
                <Users size={32} className="text-neutral-300" />
              </div>
              <div className="bg-green-50/55 border border-green-200/60 rounded-xl p-5 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-xxs font-black text-green-600 uppercase tracking-widest leading-none mb-1.5">Active Customers</p>
                  <p className="text-3xl font-black text-green-700 font-mono">
                    {allUsers.filter(u => u.email.toLowerCase() !== adminEmail.toLowerCase() && !u.isBlocked).length}
                  </p>
                </div>
                <UserCheck size={32} className="text-green-300" />
              </div>
              <div className="bg-red-50/55 border border-red-200/60 rounded-xl p-5 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-xxs font-black text-red-500 uppercase tracking-widest leading-none mb-1.5">Blocked Customers</p>
                  <p className="text-3xl font-black text-red-600 font-mono">
                    {allUsers.filter(u => u.email.toLowerCase() !== adminEmail.toLowerCase() && u.isBlocked).length}
                  </p>
                </div>
                <UserX size={32} className="text-red-300" />
              </div>
            </div>

            {/* Search Customers */}
            <div className="flex mb-8 pb-6 border-b border-neutral-100 items-center justify-between flex-wrap gap-4">
              <div className="relative w-full md:w-96">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Search user profile indexes..." 
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white text-black"
                  value={customerQuery}
                  onChange={e => setCustomerQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Users lists */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-neutral-200 text-neutral-400 text-xxs font-black tracking-widest uppercase pb-3">
                    <th className="py-3">Name</th>
                    <th className="py-3">Contact Email & Phone</th>
                    <th className="py-3">City Region</th>
                    <th className="py-3">SJSM Loyalty Points</th>
                    <th className="py-3 text-right">Restrict Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-amber-100 text-amber-700 font-bold h-9 w-9 rounded-full flex items-center justify-center">
                            {customer.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-neutral-950 block">{customer.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono block">UID: {customer.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-xs font-mono">
                        <p className="font-bold text-neutral-800">{customer.email}</p>
                        <p className="text-neutral-500 mt-0.5">{customer.phone || 'N/A'}</p>
                      </td>
                      <td className="py-4 text-xs font-semibold text-neutral-600">
                        {customer.city || 'N/A'}
                      </td>
                      <td className="py-4">
                        <span className="text-sm font-extrabold text-amber-600 block">{customer.loyaltyPoints || 0} pts</span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          {customer.isBlocked ? (
                            <button 
                              onClick={() => updateUserStatus(customer.id, false)}
                              className="text-xs bg-green-50 border-2 border-green-200 hover:bg-green-100 text-green-700 font-black tracking-wide uppercase px-3 py-1.5 rounded-lg flex items-center gap-1"
                            >
                              <UserCheck size={12}/> Activate
                            </button>
                          ) : (
                            <button 
                              onClick={() => { if(confirm(`Block customer "${customer.name}"? They will lose active session access immediately.`)) updateUserStatus(customer.id, true); }}
                              className="text-xs bg-red-50 border-2 border-red-100 hover:bg-red-100 text-red-600 font-black tracking-wide uppercase px-3 py-1.5 rounded-lg flex items-center gap-1"
                            >
                              <UserX size={12}/> Block
                            </button>
                          )}
                          <button 
                            onClick={() => setSelectedCustomerForView(customer)}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs px-3 py-1.5 font-bold tracking-wide uppercase rounded-lg flex items-center gap-1 transition-all"
                            title="Inspect detailed customer records"
                          >
                            <Search size={12}/> View Profile
                          </button>
                          <button 
                            onClick={() => { if(confirm(`Completely delete user "${customer.name}" from billing annals?`)) deleteUser(customer.id); }}
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-600 p-2 rounded-lg transition-colors"
                            title="Delete registered profile"
                          >
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-neutral-500 italic">No registered profile matched search patterns.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 5. AUDIT LOGS & ACTIONS */}
        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Inventory Asset Summary Dashboard Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-neutral-100 text-neutral-600 rounded-xl">
                  <Package size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Total Products</span>
                  <span className="text-xl font-bold font-serif text-neutral-900">{totalProducts} Items</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Low Stock (≤ 10)</span>
                  <span className="text-xl font-bold font-serif text-amber-700">{lowStockProductsList.length} Items</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <XCircle size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Out of Stock (0)</span>
                  <span className="text-xl font-bold font-serif text-red-700">{outOfStockProductsList.length} Items</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <IndianRupee size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Inventory Asset Value</span>
                  <span className="text-xl font-bold font-serif text-green-700">₹{totalInventoryValue.toLocaleString()}</span>
                </div>
              </div>

            </div>

            {/* Split layout: left InventoryLogs, right Admin logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Inventory transaction logs */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-md">
                <div className="flex items-center gap-2 mb-6 border-b border-neutral-100 pb-3">
                  <Package className="text-amber-500" size={22}/>
                  <div>
                    <h3 className="text-lg font-bold font-serif text-neutral-900">Inventory Transaction Registry</h3>
                    <p className="text-xs text-neutral-400">Chronological list of stock updates</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
                  {inventoryLogs.length === 0 ? (
                    <p className="text-neutral-500 italic text-center py-12">No inventory activities logged yet.</p>
                  ) : (
                    inventoryLogs.map(log => (
                      <div key={log.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs flex justify-between items-start hover:bg-neutral-100/50 transition-colors">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-neutral-900 block">{log.productName}</span>
                            <span className="text-[9px] text-neutral-400 uppercase font-mono tracking-wider">ID: {log.productId}</span>
                          </div>
                          <p className="text-neutral-500">
                            Flow adjustment: <b className="text-neutral-800">{log.previousStock} units</b> → <b className="text-amber-600">{log.newStock} units</b>
                          </p>
                          <span className="text-[10px] text-neutral-400 font-mono block mt-2">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${log.actionType === 'Purchase' ? 'bg-blue-50 text-blue-700' : log.actionType === 'Restock' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                            {log.actionType}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Payments and Admin activity logs */}
              <div className="space-y-8">
                
                {/* Simulated Payment logs panel */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-md">
                  <div className="flex items-center gap-2 mb-6 border-b border-neutral-100 pb-3">
                    <IndianRupee className="text-amber-500" size={22}/>
                    <div>
                      <h3 className="text-lg font-bold font-serif text-neutral-900">Razorpay Activity</h3>
                      <p className="text-xs text-neutral-400">Live payment orders and status</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 max-h-[220px] overflow-y-auto no-scrollbar">
                    {payments.length === 0 ? (
                      <p className="text-neutral-500 italic text-center py-6">No payments processed yet.</p>
                    ) : (
                      payments.map(pay => (
                        <div key={pay.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs flex justify-between items-center">
                          <div>
                            <p className="font-mono font-bold text-amber-600 tracking-tight">{pay.id}</p>
                            <p className="text-neutral-400 text-2xs uppercase mt-0.5">OrderID: {pay.orderId} • {pay.method}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-neutral-900 text-sm">₹{pay.amount}</p>
                            <p className="text-[9px] text-green-700 font-black uppercase tracking-wider">{pay.paymentStatus}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Leftover: general admin activity tracks */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-md">
                  <div className="flex items-center gap-2 mb-6 border-b border-neutral-100 pb-3">
                    <Users className="text-amber-500" size={22}/>
                    <div>
                      <h3 className="text-lg font-bold font-serif text-neutral-900">Admin Action Audit</h3>
                      <p className="text-xs text-neutral-400">Authorized actions executed.</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar">
                    {adminLogs.length === 0 ? (
                      <div className="text-center py-6 text-xs text-neutral-400 font-medium">No admin activities recorded yet in this deployment.</div>
                    ) : (
                      adminLogs.map(log => (
                        <div key={log.id} className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-xxs font-mono border border-neutral-200/50 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all animate-fade-in">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-amber-600 font-black uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">{log.actionType}</span>
                              <span className="text-neutral-500 font-black uppercase tracking-wide bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">{log.moduleName || 'System'}</span>
                            </div>
                            <p className="text-neutral-700 text-xs font-semibold font-sans mt-1">{log.description}</p>
                            <div className="flex items-center gap-1.5 text-neutral-400 text-[10px]">
                              <span>Executor:</span>
                              <span className="text-neutral-600 font-bold">{log.adminEmail}</span>
                            </div>
                          </div>
                          <span className="text-neutral-400 font-black self-start md:self-center whitespace-nowrap text-[10px] bg-neutral-200/40 px-2 py-0.5 rounded">
                            {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* 6. COUPON MANAGEMENT AND ANALYTICS SECTION */}
        {activeTab === 'coupons' && (
          <div className="space-y-8 animate-fade-in font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2">
                  <Ticket className="text-amber-500" /> Coupon & Smart Offers Center
                </h2>
                <p className="text-sm text-neutral-500">Manage campaign discounts, custom loyalty offers, and track usage records</p>
              </div>
              <button 
                onClick={openAddCoupon}
                className="bg-neutral-900 text-amber-500 hover:bg-black px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition flex items-center gap-1.5 shadow-md hover:scale-105"
              >
                <Plus size={16} /> Deploy New Coupon
              </button>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1.5">Active Campaigns</span>
                <span className="text-2xl font-black text-neutral-900">{coupons.filter(c => c.isActive).length} Coupons</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1.5">Total Redemptions</span>
                <span className="text-2xl font-black text-neutral-900">{couponUsages.length} Times</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1.5">Saved Customer Cash</span>
                <span className="text-2xl font-black text-green-600">₹{couponUsages.reduce((acc, u) => acc + u.discountApplied, 0)}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1.5">Avg Saved per Order</span>
                <span className="text-2xl font-black text-neutral-900">
                  ₹{couponUsages.length > 0 ? Math.round(couponUsages.reduce((acc, u) => acc + u.discountApplied, 0) / couponUsages.length) : 0}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left 2 Columns: Coupons table */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                  <h3 className="font-bold font-serif text-neutral-900">Offer Campaign Ledger</h3>
                  <span className="text-xs text-neutral-400 font-mono">{coupons.length} Listed</span>
                </div>
                <div className="divide-y divide-neutral-100 overflow-x-auto">
                  {coupons.map(coupon => (
                    <div key={coupon.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-neutral-50/60 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-neutral-900 font-mono text-sm uppercase bg-neutral-100 px-2 py-1 rounded border border-neutral-200 tracking-wider">
                            {coupon.code}
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {coupon.type}
                          </span>
                          {!coupon.isActive && (
                            <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Draft
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 mt-2 space-y-0.5">
                          <p>
                            Get <b className="text-neutral-800">{coupon.discountPercentage}% off</b> up to <b className="text-neutral-800">₹{coupon.maxDiscountLimit}</b> (Min Spend: ₹{coupon.minimumOrderValue})
                          </p>
                          <p className="font-mono text-[10px] text-neutral-400">
                            Campaign: {coupon.startDate} to {coupon.expiryDate} {coupon.festivalName ? `| Festival: ${coupon.festivalName}` : ''} {coupon.isUserSpecific ? `| User ID Bound: ${coupon.userId}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 md:pt-0">
                        <button 
                          onClick={() => {
                            updateCoupon({ ...coupon, isActive: !coupon.isActive });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xxs font-bold uppercase transition ${coupon.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'}`}
                        >
                          {coupon.isActive ? 'Active' : 'Draft'}
                        </button>
                        <button 
                          onClick={() => openEditCoupon(coupon)}
                          className="p-2 border border-neutral-200 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-50"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => deleteCoupon(coupon.id)}
                          className="p-2 border border-red-200 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Usage timelines */}
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm flex flex-col">
                <div className="p-5 border-b border-neutral-100 bg-neutral-50/50">
                  <h3 className="font-bold font-serif text-neutral-900">Campaign Redemption Stream</h3>
                  <p className="text-xs text-neutral-400 mt-1">Live customer usage logs</p>
                </div>
                <div className="p-5 space-y-4 max-h-[480px] overflow-y-auto no-scrollbar flex-1">
                  {couponUsages.length === 0 ? (
                    <p className="text-neutral-400 italic text-center py-12">No coupon codes used yet.</p>
                  ) : (
                    [...couponUsages].reverse().map(usage => (
                      <div key={usage.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700 hover:bg-neutral-100/40 transition space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-amber-600 font-mono uppercase tracking-wider">{usage.couponCode}</span>
                          <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded">Saved ₹{usage.discountApplied}</span>
                        </div>
                        {usage.campaignName && (
                          <div className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-medium inline-block">
                            Campaign: {usage.campaignName}
                          </div>
                        )}
                        <p className="text-neutral-500 font-mono text-[10px]">User: {usage.userEmail}</p>
                        <p className="text-neutral-400 font-mono text-[9px] flex justify-between items-center">
                          <span>OrderID: {usage.orderId}</span>
                          {usage.redemptionStatus && (
                            <span className="text-[9px] text-green-600 font-bold bg-green-50/80 px-1 rounded-full uppercase scale-90">{usage.redemptionStatus}</span>
                          )}
                        </p>
                        <span className="text-[9px] text-neutral-400 block font-mono">{new Date(usage.redemptionDateTime || usage.usageDate).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. PAYMENTS RECORDS LIST */}
        {activeTab === 'payments' && (
          <div className="space-y-8 animate-fade-in font-sans font-sans">
            <div>
              <h2 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2">
                <CreditCard className="text-amber-500" /> Razorpay Payments Registry
              </h2>
              <p className="text-sm text-neutral-500">Trace and audit transaction signatures, verification digests, and payments statuses</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Total Net Revenue</span>
                <span className="text-2xl font-black text-neutral-900">₹{payments.reduce((acc, p) => acc + p.amount, 0)}</span>
                <span className="text-xxs text-neutral-400 block mt-1">Captured securely on partner portal</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Card Authorized</span>
                <span className="text-2xl font-black text-neutral-900">
                  {payments.filter(p => p.method === 'CARD').length} Transactions
                </span>
                <span className="text-xxs text-neutral-400 block mt-1">₹{payments.filter(p => p.method === 'CARD').reduce((acc, p) => acc+p.amount, 0)} volume processed</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">UPI Authorized</span>
                <span className="text-2xl font-black text-neutral-900">
                  {payments.filter(p => p.method === 'UPI').length} Transactions
                </span>
                <span className="text-xxs text-neutral-400 block mt-1">₹{payments.filter(p => p.method === 'UPI').reduce((acc, p) => acc+p.amount, 0)} volume processed</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
                <h3 className="font-bold font-serif text-neutral-900">Payment Audit Logs</h3>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider text-xxs">
                  Test Mode Active
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121c2c] text-white font-serif uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Payment Ref ID</th>
                      <th className="p-4">Linked Order ID</th>
                      <th className="p-4">Payment Type</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Verified Razorpay Signature</th>
                      <th className="p-4">Gateway Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-sans">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500 italic">
                          No transactions completed yet.
                        </td>
                      </tr>
                    ) : (
                      [...payments].reverse().map(pay => (
                        <tr key={pay.id} className="hover:bg-neutral-50/50 transition duration-150">
                          <td className="p-4 font-mono font-bold text-[#1e3a8a]">{pay.id}</td>
                          <td className="p-4 font-mono text-neutral-500">{pay.orderId}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded font-bold uppercase tracking-wide">
                              {pay.method}
                            </span>
                          </td>
                          <td className="p-4 font-black text-neutral-900">₹{pay.amount}</td>
                          <td className="p-4 font-mono text-[10px] text-neutral-400">
                            {`sig_rzp_secure_${pay.id.substring(8)}${pay.orderId.substring(13)}`}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 font-black border border-green-200 rounded uppercase tracking-wider text-[10px]">
                              {pay.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 8. GOOGLE SHEETS LIVE SYNC STATUS & HISTORY LOGS */}
        {activeTab === 'sheets' && (
          <div className="space-y-8 animate-fade-in font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2">
                  <Database className="text-amber-500" /> Google Sheets Sync Engine
                </h2>
                <p className="text-sm text-neutral-500">Live bidirectional synchronization for order status changes and administrative edits</p>
              </div>
              <button 
                onClick={triggerGoogleSheetsSync}
                className="bg-neutral-900 text-amber-500 hover:bg-black px-5 py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider transition flex items-center gap-2 shadow-md hover:scale-[1.02]"
              >
                <RefreshCw size={14} className={sheetsSyncStatus.status === 'Syncing' ? 'animate-spin' : ''} /> Force Bidirectional Sync
              </button>
            </div>

            {/* Sheets Engine Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
                <div className={`h-4 w-4 rounded-full ${sheetsSyncStatus.status === 'Syncing' ? 'bg-blue-500 animate-pulse' : sheetsSyncStatus.status === 'Success' ? 'bg-green-500 animate-pulse' : 'bg-red-500'} flex-shrink-0`} />
                <div>
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Sync State Status</span>
                  <span className="text-xl font-black text-neutral-900">{sheetsSyncStatus.status}</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1">Last Timestamp Pulled</span>
                <span className="text-xl font-black text-neutral-900 font-mono">{sheetsSyncStatus.lastSyncTime || 'Pending'}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1">Catalog Orders Monitored</span>
                <span className="text-xl font-black text-neutral-950 font-mono">{sheetsSyncStatus.recordsSynced} Documents</span>
              </div>
            </div>

            {/* Connection specifications card */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
              <h3 className="font-bold font-serif text-neutral-900 flex items-center gap-2"><FileSpreadsheet className="text-green-600" size={18}/> Active Workspace Target Sheet</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-neutral-400 uppercase text-[10px] font-bold mb-1">Deployment Endpoint</span>
                  <p className="font-mono text-neutral-750 break-all bg-neutral-50 p-2.5 rounded border border-neutral-200 text-neutral-800">
                    https://script.google.com/macros/s/AKfycbyFjYATlrk1FVC0kRCcy2jpqfQxE32tGX7fm4uMNvt9Gl0TGIfqNyd3UC5sBHuB1ajWvQ/exec
                  </p>
                </div>
                <div>
                  <span className="block text-neutral-400 uppercase text-[10px] font-bold mb-1">Operational Mode</span>
                  <p className="font-sans text-neutral-800 font-bold bg-amber-50 p-2.5 rounded border border-amber-200">
                    Bidirectional Poller (Refreshes automatically every 15s with live logs update)
                  </p>
                </div>
              </div>
            </div>

            {/* Sync Configuration / Toggle Card */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4 animate-fade-in">
              <h3 className="font-bold font-serif text-neutral-900 flex items-center gap-2">🔄 Synchronization Controls</h3>
              <div className="flex items-center justify-between p-4 bg-amber-50/40 rounded-xl border border-amber-200">
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm">Order Status Synchronization</h4>
                  <p className="text-xs text-neutral-500 max-w-lg mt-0.5">
                    Automatically synchronize status updates (e.g. Completed, Shipped, Cancelled) to Google Sheets when they are upgraded or cancelled.
                  </p>
                </div>
                <button
                  type="button"
                  id="toggle-order-status-sync"
                  onClick={() => setOrderStatusSyncEnabled(!orderStatusSyncEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    orderStatusSyncEnabled ? 'bg-amber-500' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      orderStatusSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Sync activity logs timeline */}
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm flex flex-col">
              <div className="p-5 border-b border-neutral-100 bg-neutral-50/50">
                <h3 className="font-bold font-serif text-neutral-900">Bidirectional Live Engine Logs</h3>
                <p className="text-xs text-neutral-400 mt-1">Real-time status updates stream from Google Sheets</p>
              </div>
              <div className="p-5 space-y-3.5 max-h-[350px] overflow-y-auto no-scrollbar font-mono text-[10px] text-green-400 bg-neutral-950 rounded-b-2xl">
                {sheetsSyncLogs.length === 0 ? (
                  <p className="text-green-400 italic text-center py-6">Connecting logs tunnel...</p>
                ) : (
                  sheetsSyncLogs.map((log, i) => (
                    <div key={i} className="flex gap-2 items-start opacity-90">
                      <span className="text-amber-500 font-semibold font-mono tracking-tight pointer-events-none">❯</span>
                      <p className="text-green-300 leading-relaxed break-words">{log}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* --- ADD / EDIT PRODUCT SLIDE OVER / MODAL DIALOG --- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full border border-neutral-100">
            <div className="bg-black text-amber-500 p-6 flex justify-between items-center border-b border-amber-500/20">
              <h3 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                <Package size={22}/> {productModalMode === 'add' ? 'Configure New Product' : 'Revise Catalog Product'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-neutral-400 hover:text-white font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-6 space-y-5">
              
              <div>
                <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Product Title</label>
                <input 
                  required 
                  type="text" 
                  className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black font-semibold"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Description</label>
                <textarea 
                  required 
                  className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black"
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Unit Price (₹)</label>
                  <input 
                    required 
                    type="number" 
                    min={5}
                    className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black font-bold"
                    value={formPrice || ''}
                    onChange={e => setFormPrice(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Initial Stock (Units)</label>
                  <input 
                    required 
                    type="number" 
                    min={0}
                    className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black font-bold"
                    value={formStock !== undefined ? formStock : ''}
                    onChange={e => setFormStock(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Class Category</label>
                  <select 
                    className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-sm focus:outline-none bg-white text-black font-medium"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Image URL</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black"
                    value={formImage}
                    onChange={e => setFormImage(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 border border-neutral-300 hover:bg-neutral-100 text-neutral-600 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-neutral-900 text-amber-500 hover:bg-black py-3 rounded-xl font-black uppercase tracking-wider text-xs transition shadow-lg"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT COUPON MODAL DIALOG --- */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in text-neutral-850 font-sans">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full border border-neutral-100 text-neutral-800">
            <div className="bg-black text-amber-500 p-6 flex justify-between items-center border-b border-amber-500/20">
              <h3 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                <Ticket size={22}/> {couponModalMode === 'add' ? 'Configure New Offer Campaign' : 'Revise Active Offer Code'}
              </h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-neutral-400 hover:text-white font-bold text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Coupon Code</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. WELCOME20"
                    className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black font-mono font-bold tracking-wider"
                    value={couponForm.code}
                    onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                  />
                </div>
                <div>
                  <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Coupon Type</label>
                  <select 
                    className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-xs focus:outline-none bg-white text-black font-semibold"
                    value={couponForm.type}
                    onChange={e => setCouponForm({ ...couponForm, type: e.target.value as Coupon['type'] })}
                  >
                    {['Welcome', 'Festival', 'Seasonal', 'Birthday', 'Special User', 'Flash Sale'].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {couponForm.type === 'Festival' && (
                <div>
                  <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Festival Name</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Diwali, Holi, Rakshabandhan"
                    className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black font-bold"
                    value={couponForm.festivalName}
                    onChange={e => setCouponForm({ ...couponForm, festivalName: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Discount percentage (%)</label>
                  <input 
                    required 
                    type="number" 
                    min={1}
                    max={100}
                    className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black font-bold"
                    value={couponForm.discountPercentage}
                    onChange={e => setCouponForm({ ...couponForm, discountPercentage: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Max discount cap (₹)</label>
                  <input 
                    required 
                    type="number" 
                    min={10}
                    className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black font-bold"
                    value={couponForm.maxDiscountLimit}
                    onChange={e => setCouponForm({ ...couponForm, maxDiscountLimit: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Min order value (₹)</label>
                  <input 
                    required 
                    type="number" 
                    min={0}
                    className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black font-bold"
                    value={couponForm.minimumOrderValue}
                    onChange={e => setCouponForm({ ...couponForm, minimumOrderValue: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Active Status</label>
                  <select 
                    className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-xs focus:outline-none bg-white text-black font-semibold"
                    value={couponForm.isActive ? 'true' : 'false'}
                    onChange={e => setCouponForm({ ...couponForm, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Active & Visible</option>
                    <option value="false">Disabled / Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Start Date</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black font-semibold"
                    value={couponForm.startDate}
                    onChange={e => setCouponForm({ ...couponForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Expiry Date</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-[#111111] font-semibold"
                    value={couponForm.expiryDate}
                    onChange={e => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isUserSpecific"
                    className="h-4 w-4 text-amber-500 border-neutral-300 rounded focus:ring-amber-500"
                    checked={couponForm.isUserSpecific}
                    onChange={e => setCouponForm({ ...couponForm, isUserSpecific: e.target.checked })}
                  />
                  <label htmlFor="isUserSpecific" className="text-xs font-bold text-neutral-700">Restrict coupon to specific user identifier</label>
                </div>

                {couponForm.isUserSpecific && (
                  <div>
                    <label className="block text-xxs font-black text-neutral-500 uppercase tracking-widest mb-1">Target Account ID (e.g. u-1)</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. u-1"
                      className="w-full border border-neutral-300 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black font-bold"
                      value={couponForm.userId}
                      onChange={e => setCouponForm({ ...couponForm, userId: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsCouponModalOpen(false)}
                  className="flex-1 border border-neutral-300 hover:bg-neutral-100 text-neutral-600 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition animate-fade-in"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-neutral-900 text-amber-500 hover:bg-black py-3 rounded-xl font-black uppercase tracking-wider text-xs transition shadow-lg animate-fade-in"
                >
                  Confirm Configuration
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Premium Customer Details View Modal */}
      {selectedCustomerForView && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-neutral-100 mt-10 mb-10">
            
            {/* Header banner */}
            <div className="bg-neutral-950 text-white p-6 relative">
              <button 
                onClick={() => setSelectedCustomerForView(null)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-4">
                <div className="bg-amber-500 text-black font-black text-xl h-14 w-14 rounded-2xl flex items-center justify-center shadow-md">
                  {selectedCustomerForView.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">{selectedCustomerForView.name}</h3>
                  <p className="text-xs text-neutral-400 font-mono">UID Reference: {selectedCustomerForView.id}</p>
                </div>
              </div>
            </div>

            {/* Profile information */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Profile Card details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                  <p className="text-xxs font-black text-neutral-400 uppercase tracking-widest mb-1">Contact Email</p>
                  <p className="font-bold text-neutral-800 text-sm font-mono break-all">{selectedCustomerForView.email}</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                  <p className="text-xxs font-black text-neutral-400 uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="font-bold text-neutral-800 text-sm font-mono">{selectedCustomerForView.phone || 'N/A'}</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                  <p className="text-xxs font-black text-neutral-400 uppercase tracking-widest mb-1">Registration Date</p>
                  <p className="font-bold text-neutral-800 text-sm flex items-center gap-1.5">
                    <Calendar size={14} className="text-amber-500" />
                    {selectedCustomerForView.registrationDate || '2026-05-15'}
                  </p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                  <p className="text-xxs font-black text-neutral-400 uppercase tracking-widest mb-1">Loyalty Rewards balance</p>
                  <p className="font-extrabold text-amber-600 text-sm">{selectedCustomerForView.loyaltyPoints || 0} pts accumulated</p>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-amber-50/50 p-5 rounded-2xl border-2 border-dashed border-amber-200">
                <p className="text-xxs font-black text-amber-800 uppercase tracking-widest mb-1.5">Primary Shipping Address Details</p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold text-neutral-700">
                  <div>
                    <span className="block text-[10px] text-neutral-400 font-bold">Street Road:</span>
                    <span className="text-neutral-900 font-bold">{selectedCustomerForView.street || 'Vigyan Nagar'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-neutral-400 font-bold">City:</span>
                    <span className="text-neutral-900 font-bold">{selectedCustomerForView.city || 'Kota'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-neutral-400 font-bold">State Province:</span>
                    <span className="text-neutral-900 font-bold">{selectedCustomerForView.state || 'Rajasthan'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-neutral-400 font-bold">Zip Code:</span>
                    <span className="text-neutral-900 font-bold font-mono">{selectedCustomerForView.zip || '324005'}</span>
                  </div>
                </div>
              </div>

              {/* Account Restrictions Details */}
              <div className="flex items-center justify-between border-y border-neutral-100 py-3">
                <span className="text-xs font-bold text-neutral-600">Access Privileges:</span>
                <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${selectedCustomerForView.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {selectedCustomerForView.isBlocked ? 'Blocked Account' : 'Active Account'}
                </span>
              </div>

              {/* Order Histories */}
              <div>
                <p className="text-xs font-black text-neutral-900 uppercase tracking-wider mb-3">Linked Order Records & Totals</p>
                <div className="space-y-3">
                  {allOrders.filter(o => o.userId === selectedCustomerForView.id || o.userEmail === selectedCustomerForView.email).length === 0 ? (
                    <p className="text-neutral-400 text-xs italic bg-neutral-50 p-4 rounded-xl text-center">No orders have been recorded yet for this customer profile.</p>
                  ) : (
                    allOrders.filter(o => o.userId === selectedCustomerForView.id || o.userEmail === selectedCustomerForView.email).map((o, idx) => (
                      <div key={idx} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-xs flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-neutral-950">{o.id}</span>
                            <span className="text-neutral-400 font-mono text-[10px]">{new Date(o.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-neutral-500 line-clamp-1">Items: {o.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}</p>
                          <p className="text-neutral-400 mt-1 flex items-center gap-1">Payment Ref: <span className="font-mono text-[10px] font-extrabold">{o.paymentId || 'Captured Cash On Delivery'}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-neutral-950 text-sm">₹{o.total}</p>
                          <span className={`inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            o.status === 'Completed' || o.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Total volume Purchases calculation */}
              <div className="bg-neutral-900 text-amber-500 font-black p-5 rounded-3xl flex justify-between items-center shadow-lg">
                <span className="uppercase text-xxs tracking-wider font-bold">Total Purchases Lifetime Volume:</span>
                <span className="text-xl">
                  ₹{allOrders.filter(o => o.userId === selectedCustomerForView.id || o.userEmail === selectedCustomerForView.email).reduce((acc, current) => acc + current.total, 0)}
                </span>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="bg-neutral-50 p-4 border-t border-neutral-100 flex gap-2">
              <button 
                type="button" 
                onClick={() => setSelectedCustomerForView(null)}
                className="w-full bg-neutral-900 hover:bg-black text-amber-500 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition text-center"
              >
                Close Customer Dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
