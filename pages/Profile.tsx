import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../services/store';
import { 
  Package, User as UserIcon, MapPin, Edit2, Save, X, Gift, Award, 
  CheckCircle, Calendar, ShieldCheck, Mail, Phone, Lock, AlertCircle 
} from 'lucide-react';
import { Order } from '../types';

const Profile: React.FC = () => {
  const { user, orders, updateProfile, cancelOrder, checkCancellationEligibility } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      name: '',
      phone: '',
      street: '',
      city: '',
      newPassword: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Cancellation state fields
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [eligibility, setEligibility] = useState<{ eligible: boolean; orderDateStr: string; timePassedStr: string } | null>(null);
  const [cancelResult, setCancelResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  const handleOpenCancelModal = (order: Order) => {
    const status = checkCancellationEligibility(order.id);
    setCancellingOrder(order);
    setEligibility(status);
    setCancelResult(null);
  };

  if (!user) return <Navigate to="/login" />;

  const startEditing = () => {
      setFormData({
          name: user.name,
          phone: user.phone || '',
          street: user.street || '',
          city: user.city || '',
          newPassword: ''
      });
      setMessage(null);
      setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name.trim()) {
          setMessage({ type: 'error', text: 'Full Name cannot be empty.' });
          return;
      }
      if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
          setMessage({ type: 'error', text: 'Mobile number must be exactly 10 digits.' });
          return;
      }

      const updatePayload: any = {
        name: formData.name,
        phone: formData.phone,
        street: formData.street,
        city: formData.city
      };

      if (formData.newPassword) {
        if (formData.newPassword.length < 6) {
          setMessage({ type: 'error', text: 'New Password must be at least 6 characters long.' });
          return;
        }
        updatePayload.newPassword = formData.newPassword;
      }

      updateProfile(updatePayload);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Your profile has been updated successfully.' });
  };

  // Derive counts from actual order history
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Completed' && o.status !== 'Delivered').length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length;
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;

  // 5-hour cancellation logic
  const isOrderCancellable = (order: Order) => {
    if (order.status === 'Cancelled' || order.status === 'Delivered' || order.status === 'Completed') {
      return false;
    }
    const orderTimeMs = order.date ? new Date(order.date).getTime() : Date.now();
    const fiveHoursInMs = 5 * 60 * 60 * 1000;
    return (Date.now() - orderTimeMs) < fiveHoursInMs;
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold font-serif text-neutral-900 mb-8" id="profile-main-title">My Customer Portal</h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center text-sm font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Customer Profile Column */}
          <div className="col-span-1">
            <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-6 sticky top-24 space-y-6">
              
              {/* Profile Card Header */}
              <div className="flex items-center space-x-4 border-b border-neutral-100 pb-5">
                <div className="h-14 w-14 rounded-full bg-neutral-900 flex items-center justify-center text-amber-500 font-extrabold text-2xl border-2 border-amber-500 shadow flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h2 className="text-lg font-extrabold text-neutral-900 truncate">{user.name}</h2>
                  <p className="text-neutral-500 text-xs font-mono truncate">{user.email}</p>
                </div>
              </div>

              {/* Loyalty Status Badge */}
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl p-4 text-neutral-900 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-white opacity-25 rounded-full" />
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-955 opacity-75">Loyalty Points</p>
                    <p className="text-3xl font-black">{user.loyaltyPoints || 0}</p>
                  </div>
                  <Award size={28} className="text-neutral-900 opacity-60" />
                </div>
                <p className="text-[10px] mt-2 font-semibold">Earned on previous checkouts at Shri Jain Stationery Mart</p>
              </div>

              {/* Profile Details Block */}
              {!isEditing ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Profile Details</h3>
                  
                  <div className="space-y-3 text-sm text-neutral-600">
                    <div className="flex items-start">
                      <UserIcon size={16} className="mt-0.5 mr-3 text-neutral-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-neutral-400 font-bold">Full Name</p>
                        <p className="font-semibold text-neutral-800">{user.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Mail size={16} className="mt-0.5 mr-3 text-neutral-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-neutral-400 font-bold">Email Address</p>
                        <p className="font-semibold text-neutral-800">{user.email}</p>
                        <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded font-mono border border-neutral-200 mt-1 inline-block">Primary Account ID</span>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Phone size={16} className="mt-0.5 mr-3 text-neutral-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-neutral-400 font-bold">Mobile Number</p>
                        <p className="font-semibold text-neutral-800">{user.phone || 'Not configured'}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPin size={16} className="mt-0.5 mr-3 text-neutral-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-neutral-400 font-bold">Shipping Address</p>
                        <p className="font-semibold text-neutral-800">
                          {user.street || 'No street set'}{user.city ? `, ${user.city}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Calendar size={16} className="mt-0.5 mr-3 text-neutral-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-neutral-400 font-bold">Registered On</p>
                        <p className="font-semibold text-neutral-800 font-mono text-xs">{user.registrationDate || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <ShieldCheck size={16} className="mt-0.5 mr-3 text-neutral-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-neutral-400 font-bold">Account Status</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
                            {user.isBlocked ? 'Restricted' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={startEditing} 
                    className="w-full flex items-center justify-center py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 font-bold transition shadow-sm border border-neutral-800 text-sm"
                  >
                    <Edit2 size={15} className="mr-2" /> Edit Profile Details
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <h3 className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Modify Profile</h3>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full border border-neutral-300 rounded-xl p-2.5 text-sm bg-white text-black font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1">Email <span className="text-[10px] text-neutral-400 font-normal">(Primary ID - Not Editable)</span></label>
                    <input 
                      type="text" 
                      disabled 
                      className="w-full border border-neutral-200 rounded-xl p-2.5 text-sm bg-neutral-100 text-neutral-500 font-mono" 
                      value={user.email} 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Mobile Number (10 digits)</label>
                    <input 
                      type="tel" 
                      className="w-full border border-neutral-300 rounded-xl p-2.5 text-sm bg-white text-black font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="e.g. 9876543210" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Street Address</label>
                    <input 
                      type="text" 
                      className="w-full border border-neutral-300 rounded-xl p-2.5 text-sm bg-white text-black font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500" 
                      value={formData.street} 
                      onChange={e => setFormData({...formData, street: e.target.value})} 
                      placeholder="Street name, landmark" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">City</label>
                    <input 
                      type="text" 
                      className="w-full border border-neutral-300 rounded-xl p-2.5 text-sm bg-white text-black font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500" 
                      value={formData.city} 
                      onChange={e => setFormData({...formData, city: e.target.value})} 
                      placeholder="City (e.g. Kota)" 
                    />
                  </div>

                  <div className="pt-2 border-t border-neutral-100">
                    <label className="block text-xs font-bold text-red-600 mb-1 flex items-center">
                      <Lock size={12} className="mr-1" /> Change Account Password
                    </label>
                    <input 
                      type="password" 
                      className="w-full border border-neutral-300 rounded-xl p-2.5 text-sm bg-white text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500" 
                      value={formData.newPassword} 
                      onChange={e => setFormData({...formData, newPassword: e.target.value})} 
                      placeholder="Type a new password (min. 6 chars)" 
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button 
                      type="submit" 
                      className="flex-1 bg-amber-500 text-black py-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-amber-400 shadow-sm text-xs"
                    >
                      <Save size={14} className="mr-1.5" /> Save Changes
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)} 
                      className="flex-1 bg-neutral-100 text-neutral-700 py-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-neutral-200 text-xs"
                    >
                      <X size={14} className="mr-1.5" /> Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Core Orders History Column */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            
            {/* Order Metrics Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center shadow-xs">
                <span className="text-2xl font-black text-neutral-950 font-mono block">{totalOrders}</span>
                <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mt-1">Total Orders</span>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center shadow-xs">
                <span className="text-2xl font-black text-blue-600 font-mono block">{activeOrders}</span>
                <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mt-1">Active Orders</span>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center shadow-xs">
                <span className="text-2xl font-black text-green-600 font-mono block">{deliveredOrders}</span>
                <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mt-1">Delivered</span>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center shadow-xs">
                <span className="text-2xl font-black text-neutral-400 font-mono block">{cancelledOrders}</span>
                <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block mt-1">Cancelled</span>
              </div>
            </div>

            {/* Complete Order History Panel */}
            <div className="bg-white shadow-sm border border-neutral-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6 border-b border-neutral-100 pb-4">
                <h2 className="text-xl font-extrabold font-serif text-neutral-900 flex items-center">
                  <Package className="mr-2 text-neutral-400" size={20} /> My Order Records
                </h2>
                <span className="text-xs bg-neutral-100 border border-neutral-200 font-mono px-2.5 py-1 rounded text-neutral-600 font-bold">{orders.length} Order(s)</span>
              </div>
              
              {orders.length === 0 ? (
                <div className="text-center py-16 text-neutral-500">
                  <Package size={52} className="mx-auto mb-4 text-neutral-300" />
                  <p className="font-extrabold text-neutral-800 text-lg">No Orders Made Yet</p>
                  <p className="text-xs text-neutral-400 mt-1">Once you complete a checkout utilizing cards or UPI via Razorpay, your records will populate here in real-time.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map(order => {
                    const cancellable = isOrderCancellable(order);
                    const formattedDate = order.orderDate || new Date(order.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const formattedTime = order.orderTime || new Date(order.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
                    const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

                    return (
                      <div key={order.id} className="border border-neutral-200 rounded-xl overflow-hidden shadow-xs hover:border-neutral-300 transition duration-150 bg-white">
                        
                        {/* Upper Header Metadata Area */}
                        <div className="bg-neutral-50 px-5 py-4 border-b border-neutral-200 flex justify-between items-center flex-wrap gap-4 text-sm">
                          <div>
                             <p className="text-[10px] text-neutral-400 uppercase font-extrabold tracking-wider">Order ID</p>
                             <p className="font-bold text-neutral-800 font-mono">{order.id}</p>
                          </div>
                          <div>
                             <p className="text-[10px] text-neutral-400 uppercase font-extrabold tracking-wider">Placed Date</p>
                             <p className="font-semibold text-neutral-800 font-mono text-xs">{formattedDate}</p>
                          </div>
                          <div>
                             <p className="text-[10px] text-neutral-400 uppercase font-extrabold tracking-wider">Placed Time</p>
                             <p className="font-semibold text-neutral-800 font-mono text-xs">{formattedTime}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] text-neutral-400 uppercase font-extrabold tracking-wider">Total Amount</p>
                             <p className="font-black text-lg text-neutral-900">₹{order.total}</p>
                          </div>
                        </div>

                        {/* Mid List of Ordered Products */}
                        <div className="px-5 py-3">
                          <ul className="divide-y divide-neutral-100">
                            {order.items.map(item => (
                              <li key={item.id} className="py-2.5 flex justify-between items-center text-sm">
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 bg-neutral-100 border border-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                  <span className="text-neutral-800 font-semibold leading-tight">
                                    {item.name} <span className="text-neutral-450 font-bold ml-1.5 font-mono">x{item.quantity}</span>
                                  </span>
                                </div>
                                <span className="font-bold text-neutral-900 font-mono">₹{item.price * item.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Estimated Delivery Display Area */}
                        <div className="px-5 py-3.5 bg-amber-50/20 border-t border-neutral-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar size={15} className="text-amber-600" />
                            <span className="text-neutral-500 font-bold">Estimated Delivery Date:</span>
                            <span className="font-mono font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              {order.estimatedDelivery || order.deliveryDate || '3 Days'}
                            </span>
                          </div>
                          {order.status === 'Delivered' && order.deliveredDate && ( 
                            <div className="text-xs text-green-700 font-bold flex items-center gap-1.5">
                              <CheckCircle size={15} />
                              <span>Delivered on: <span className="font-mono font-extrabold">{order.deliveredDate}</span></span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Action bar, Status tags & Cancellation Checkpoints */}
                        <div className="bg-[#fcfdfd] px-5 py-4 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 text-xs font-bold">
                          
                          {/* Left: General Order Status Indicators */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-neutral-400 uppercase tracking-widest text-[9px] font-extrabold">Payment:</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 font-mono text-[10px] tracking-wider border border-green-200 uppercase">
                              PAID
                            </span>
                            
                            <span className="text-neutral-400 uppercase tracking-widest text-[9px] font-extrabold">Status:</span>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold leading-none ${
                              order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-100' :
                              order.status === 'Delivered' || order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              'bg-blue-50 text-blue-800 border border-blue-100'
                            }`}>
                              {order.status === 'Delivered' && <CheckCircle size={12} className="mr-1" />}
                              {order.status}
                            </span>
                          </div>

                          {/* Right: Cancellation checks & buttons */}
                          <div className="flex flex-row items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderDetails(order)}
                              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white font-bold text-center uppercase tracking-wider leading-none transition shadow-sm text-[11px]"
                            >
                              Track & Details
                            </button>
                            {order.status !== 'Cancelled' && order.status !== 'Delivered' && order.status !== 'Completed' && (
                              <button
                                type="button"
                                onClick={() => handleOpenCancelModal(order)}
                                className="px-4 py-2 rounded-lg bg-red-650 hover:bg-red-700 text-white font-bold text-center uppercase tracking-wider leading-none transition shadow-sm text-[11px]"
                              >
                                Cancel Order
                              </button>
                            )}
                            
                            {order.pointsEarned && order.pointsEarned > 0 && order.status !== 'Cancelled' && (
                              <span className="text-[10px] font-bold text-amber-600 flex items-center mt-1">
                                <Gift size={11} className="mr-1" /> Earned +{order.pointsEarned} Loyalty Points
                              </span>
                            )}
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {cancellingOrder && eligibility && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="cancel-order-modal">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-neutral-100 transform scale-100 transition-all">
            <div className="bg-neutral-950 text-white p-6 relative">
              <button
                onClick={() => setCancellingOrder(null)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
              >
                ✕
              </button>
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                <AlertCircle className="text-amber-500 animate-pulse" size={24} />
                Order Cancellation Center
              </h3>
              <p className="text-xs text-neutral-400 font-mono mt-1">Reference ID: {cancellingOrder.id}</p>
            </div>

            <div className="p-6 space-y-5">
              {/* 1. ORDER SUMMARY */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
                <p className="text-xxs font-black text-neutral-400 uppercase tracking-widest leading-none">Order Summary</p>
                <div className="space-y-1.5 divide-y divide-neutral-150">
                  {cancellingOrder.items.map(item => (
                    <div key={item.id} className="text-xs text-neutral-800 flex justify-between pt-1.5 first:pt-0">
                      <span>{item.name} <span className="font-bold text-neutral-500">x{item.quantity}</span></span>
                      <span className="font-mono font-bold text-neutral-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t-2 border-dashed border-neutral-200 pt-2.5 flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-500">Total Amount:</span>
                  <span className="text-base font-black text-amber-600 font-mono">₹{cancellingOrder.total}</span>
                </div>
              </div>

              {/* 2. TIME STATUS */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                <p className="text-xxs font-black text-neutral-400 uppercase tracking-widest leading-none">Cancellation Eligibility Details</p>
                <div className="text-xs space-y-1.5 text-neutral-700">
                  <p className="flex justify-between"><span className="font-bold text-neutral-500">Placed Date & Time:</span> <span className="font-mono text-neutral-900 font-semibold">{eligibility.orderDateStr}</span></p>
                  <p className="flex justify-between"><span className="font-bold text-neutral-500">Time Expired/Passed:</span> <span className="font-mono bg-neutral-200 px-2 py-0.5 rounded text-neutral-800 font-extrabold">{eligibility.timePassedStr}</span></p>
                </div>
              </div>

              {/* Dynamic checking message */}
              {eligibility.eligible ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-xs font-semibold leading-relaxed">
                  ✓ Your order is fully eligible for cancellation. Clicking "Confirm Cancel" below will instantly cancel your order, restore raw stock levels, and refund points in real-time.
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-250 rounded-2xl text-red-650 text-xs font-bold leading-normal">
                  ⚠️ Cancellation period expired. This order was placed {eligibility.timePassedStr} ago. Orders can only be cancelled within 5 hours.
                </div>
              )}

              {cancelResult && (
                <div className={`p-4 rounded-2xl text-xs font-bold border ${cancelResult.success ? 'bg-green-100 text-green-800 border-green-200 animate-bounce' : 'bg-red-100 text-red-850 border-red-200'}`}>
                  {cancelResult.message}
                </div>
              )}
            </div>

            <div className="bg-neutral-50 p-4 border-t border-neutral-100 flex gap-3">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="flex-1 border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition text-center"
              >
                Close
              </button>
              {eligibility.eligible && !cancelResult?.success && (
                <button
                  type="button"
                  onClick={() => {
                    cancelOrder(cancellingOrder.id).then(res => {
                      setCancelResult(res);
                      if (res.success) {
                        // Instantly recheck to refresh display
                        const newStatus = checkCancellationEligibility(cancellingOrder.id);
                        setEligibility(newStatus);
                      }
                    });
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs transition text-center shadow-md text-white"
                >
                  Confirm Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Track & Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="order-details-modal">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-neutral-100 transform scale-100 transition-all flex flex-col">
            
            {/* Header */}
            <div className="bg-neutral-950 text-white p-6 relative flex-shrink-0">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
              >
                ✕
              </button>
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                <Package className="text-amber-500" size={24} />
                Order Tracking & Details
              </h3>
              <p className="text-xs text-neutral-400 font-mono mt-1">Order Reference: {selectedOrderDetails.id}</p>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              
              {/* Order Status Timeline Banner */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xxs font-black text-neutral-400 uppercase tracking-widest leading-none">Current Status</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${
                    selectedOrderDetails.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-700' :
                    selectedOrderDetails.status === 'Delivered' || selectedOrderDetails.status === 'Completed' ? 'bg-green-100 border-green-200 text-green-800' :
                    'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
                  }`}>
                    {selectedOrderDetails.status}
                  </span>
                </div>

                {/* Progress bar timeline viz */}
                {selectedOrderDetails.status !== 'Cancelled' && (
                  <div className="mt-4">
                    <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden relative">
                      <div className={`h-full bg-amber-500 transition-all duration-500 ${
                        selectedOrderDetails.status === 'Processing' ? 'w-1/3' :
                        selectedOrderDetails.status === 'Packed' ? 'w-1/2' :
                        selectedOrderDetails.status === 'Shipped' ? 'w-3/4' :
                        selectedOrderDetails.status === 'Delivered' || selectedOrderDetails.status === 'Completed' ? 'w-full' : 'w-[10%]'
                      }`} />
                    </div>
                    {/* Tiny nodes */}
                    <div className="flex justify-between text-[10px] text-neutral-400 font-black tracking-wider mt-2 uppercase">
                      <span className={selectedOrderDetails.status === 'Processing' ? 'text-amber-600 font-black' : ''}>Processing</span>
                      <span className={selectedOrderDetails.status === 'Packed' ? 'text-amber-600 font-black' : ''}>Packed</span>
                      <span className={selectedOrderDetails.status === 'Shipped' ? 'text-amber-600 font-black' : ''}>Shipped</span>
                      <span className={(selectedOrderDetails.status === 'Delivered' || selectedOrderDetails.status === 'Completed') ? 'text-green-600 font-black' : ''}>Delivered</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Timestamps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Ordered Date / Time</span>
                  <p className="font-mono text-xs font-bold text-neutral-900">
                    {selectedOrderDetails.orderDate || new Date(selectedOrderDetails.date).toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Estimated Delivery</span>
                  <p className="font-mono text-xs font-extrabold text-amber-900">
                    {selectedOrderDetails.estimatedDelivery || selectedOrderDetails.deliveryDate || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Delivered on status message */}
              {selectedOrderDetails.status === 'Delivered' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-800 text-sm font-bold animate-fade-in">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="leading-tight">Delivered on:</p>
                    <p className="text-xs font-mono font-black text-green-600 block mt-0.5">
                      {selectedOrderDetails.deliveredDate || new Date(selectedOrderDetails.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Customer and Payment Info */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3.5">
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-200 pb-1.5 leading-none">Customer & Payment Profile</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-medium text-neutral-700">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase">Customer Name</p>
                    <p className="font-semibold text-neutral-900 mt-0.5">{selectedOrderDetails.customerName || user.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase">Phone Number</p>
                    <p className="font-mono text-neutral-900 font-semibold mt-0.5">{selectedOrderDetails.customerPhone || user.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase">Payment Method</p>
                    <p className="font-semibold text-neutral-900 mt-0.5">{selectedOrderDetails.paymentMethod || 'UPI/Card'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase">Payment Status</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 font-mono text-[10px] tracking-wider border border-green-205 mt-0.5 uppercase font-bold">
                      PAID
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase">Shipping Address</p>
                    <p className="font-semibold text-neutral-900 mt-0.5">{selectedOrderDetails.address}</p>
                  </div>
                </div>
              </div>

              {/* Product Listing */}
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3">
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-200 pb-1.5 leading-none">Ordered Items</h4>
                <div className="space-y-3 divide-y divide-neutral-150">
                  {selectedOrderDetails.items.map(item => (
                    <div key={item.id} className="pt-3 first:pt-0 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-9 h-9 object-cover rounded-lg border border-neutral-200 bg-white" referrerPolicy="no-referrer" />
                        <div>
                          <p className="font-bold text-neutral-900">{item.name}</p>
                          <p className="text-neutral-400 font-bold font-mono">₹{item.price} x {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-mono font-extrabold text-neutral-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-dashed border-neutral-250 pt-3 flex justify-between items-center">
                  <span className="text-xs font-black text-neutral-500 uppercase tracking-wider">Total Quantity:</span>
                  <span className="text-xs font-mono font-bold text-neutral-800">
                    {selectedOrderDetails.items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </span>
                </div>

                <div className="border-t-2 border-dashed border-neutral-250 pt-3 flex justify-between items-center">
                  <span className="text-sm font-black text-neutral-900 uppercase tracking-wider">Total Paid Amount:</span>
                  <span className="text-lg font-black text-amber-600 font-mono">₹{selectedOrderDetails.total}</span>
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="bg-neutral-50 p-4 border-t border-neutral-100 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="flex-1 bg-neutral-900 hover:bg-black text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs transition text-center shadow-md cursor-pointer"
              >
                Close Tracking
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
