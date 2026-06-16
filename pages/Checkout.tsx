
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../services/store';
import { useAuth } from '../services/store';
import { AddressInfo } from '../types';
import { CreditCard, CheckCircle, Loader2, AlertCircle, Wallet, Gift, Ticket, ChevronLeft } from 'lucide-react';

// Define available coupons
const AVAILABLE_COUPONS = [
  { code: 'WELCOME50', description: 'Flat ₹50 OFF (Min Order: ₹500)' },
  { code: 'SJSM10', description: '10% OFF on all orders' }
];

// Provided Google Sheets Web App URL from the latest request
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyFjYATlrk1FVC0kRCcy2jpqfQxE32tGX7fm4uMNvt9Gl0TGIfqNyd3UC5sBHuB1ajWvQ/exec';

const Checkout: React.FC = () => {
  const { cart, cartTotal, clearCart, shippingCharge, deliveryDate, applyCoupon, discount, couponCode, removeCoupon } = useCart();
  const { user, addOrder, updateProfile, coupons, recordCouponUsage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
          if(!user) navigate('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Address, 2: Payment, 3: Success
  
  const userPoints = user?.loyaltyPoints || 0;
  const [redeemPoints, setRedeemPoints] = useState(false);
  
  const subTotalWithShipping = cartTotal + shippingCharge;
  const totalAfterCoupon = Math.max(0, subTotalWithShipping - discount);
  const pointsToRedeem = redeemPoints ? Math.min(userPoints, Math.floor(totalAfterCoupon)) : 0;
  const finalTotal = Math.max(0, totalAfterCoupon - pointsToRedeem);
  const potentialPoints = Math.min(50, Math.floor(finalTotal / 100));
  
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [address, setAddress] = useState<AddressInfo>({
    fullName: '',
    street: '',
    city: '',
    state: 'Rajasthan',
    zip: '',
    phone: ''
  });

  useEffect(() => {
    if (user) {
        setAddress({
            fullName: user.name || '',
            street: user.street || '',
            city: user.city || '', 
            state: 'Rajasthan',
            zip: '',
            phone: user.phone || ''
        });
    }
  }, [user]);
  
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [typedCoupon, setTypedCoupon] = useState('');

  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [razorpayMethod, setRazorpayMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [razorpayBank, setRazorpayBank] = useState('SBI');
  const [razorpayState, setRazorpayState] = useState<'idle' | 'authorizing' | 'completed'>('idle');
  const [generatedPayId, setGeneratedPayId] = useState('');

  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const [error, setError] = useState<string | null>(null);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.street || !address.city || !address.zip) {
        setError('Please fill in all address details.');
        return;
    }
    if (!/^\d{10}$/.test(address.phone)) {
        setError('Phone number must be exactly 10 digits.');
        return;
    }
    if (!/^\d{6}$/.test(address.zip)) {
        setError('ZIP Code must be exactly 6 digits.');
        return;
    }
    setError(null);
    setStep(2);
  };

  const handleApplyCoupon = (code: string) => {
    const result = applyCoupon(code);
    if(result.success) {
        setCouponMessage({ type: 'success', text: result.message });
    } else {
        setCouponMessage({ type: 'error', text: result.message });
    }
  };

  // Validates standard local details, then opens Razorpay test gateway
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paymentMethod === 'CARD') {
        const cleanCard = cardDetails.number.replace(/\s/g, '');
        if (cleanCard.length !== 16) {
            setError('Please enter a valid 16-digit card number.');
            return;
        }
        if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
            setError('Please enter expiry in MM/YY format.');
            return;
        }
        if (cardDetails.cvv.length !== 3) {
            setError('Please enter a 3-digit CVV.');
            return;
        }
        if (!cardDetails.name.trim()) {
            setError('Please enter the cardholder name.');
            return;
        }
        setRazorpayMethod('CARD');
    } else if (paymentMethod === 'UPI') {
        if (!upiId.includes('@')) {
            setError('Invalid UPI ID format. Must contain "@"');
            return;
        }
        const prefix = upiId.split('@')[0];
        if (!/^\d{10}$/.test(prefix)) {
            setError('The UPI ID prefix (before @) must be a 10-digit mobile number.');
            return;
        }
        setRazorpayMethod('UPI');
    }

    // Set interactive Razorpay modal state to triggered
    setRazorpayState('idle');
    setGeneratedPayId(`pay_rzp_TST${Math.floor(1000 + Math.random() * 9000)}${Date.now().toString().slice(-6)}`);
    setIsRazorpayOpen(true);
  };

  // Triggers once Razorpay process succeeds
  const finalizeRazorpayOrder = async () => {
    if (user?.isBlocked) {
      setError('Your account has been temporarily restricted. Please contact support.');
      setIsRazorpayOpen(false);
      return;
    }
    setIsProcessing(true);
    setIsRazorpayOpen(false);

    const pointsEarned = potentialPoints;
    const orderId = `ORD-${Date.now()}`;
    
    const orderplacementDate = new Date();
    
    // Ordered Date: DD/MM/YYYY HH:MM:SS
    const dd = String(orderplacementDate.getDate()).padStart(2, '0');
    const mm = String(orderplacementDate.getMonth() + 1).padStart(2, '0');
    const yyyy = orderplacementDate.getFullYear();
    const hh = String(orderplacementDate.getHours()).padStart(2, '0');
    const min = String(orderplacementDate.getMinutes()).padStart(2, '0');
    const ss = String(orderplacementDate.getSeconds()).padStart(2, '0');
    const exactOrderedDate = `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
    const exactOrderedTime = `${hh}:${min}:${ss}`;

    // Estimated Delivery Date = Placed Date + 3 Days
    const deliveryDateObj = new Date(orderplacementDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const delDD = String(deliveryDateObj.getDate()).padStart(2, '0');
    const delMM = String(deliveryDateObj.getMonth() + 1).padStart(2, '0');
    const delYYYY = deliveryDateObj.getFullYear();
    const displayEstimatedDelivery = `${delDD}/${delMM}/${delYYYY}`;
    const rawDeliveryDate = `${delYYYY}-${delMM}-${delDD}`;

    const actualPaymentMethod = razorpayMethod === 'CARD' ? 'Card' : razorpayMethod === 'UPI' ? 'UPI' : 'UPI';

    const newOrder = {
      id: orderId,
      items: [...cart],
      subtotal: cartTotal,
      deliveryCharge: shippingCharge,
      discount: discount + pointsToRedeem,
      total: finalTotal,
      date: new Date().toISOString(),
      deliveryDate: rawDeliveryDate,
      status: 'Processing' as const,
      address: `${address.street}, ${address.city}, ${address.state} - ${address.zip}`,
      pointsEarned: pointsEarned,
      paymentId: generatedPayId,
      customerName: address.fullName,
      customerPhone: address.phone,
      streetAddress: address.street,
      city: address.city,
      zipcode: address.zip,
      orderDate: exactOrderedDate,
      orderTime: exactOrderedTime,
      estimatedDelivery: displayEstimatedDelivery,
      paymentMethod: actualPaymentMethod
    };

    // 1. Add order via store context (deducts stock automatic, logs payments and inventory!)
    addOrder(newOrder, actualPaymentMethod, generatedPayId);
    
    // 2. Record coupon usage
    if (couponCode && user) {
      const matchedCoupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
      const campaignName = matchedCoupon ? (matchedCoupon.festivalName ? `${matchedCoupon.type} - ${matchedCoupon.festivalName}` : matchedCoupon.type) : 'Standard Promo';
      recordCouponUsage({
        userId: user.id,
        userEmail: user.email,
        couponCode: couponCode,
        usageDate: new Date().toISOString(),
        discountApplied: discount,
        orderId: orderId,
        campaignName: campaignName,
        discountAmount: discount,
        redemptionDateTime: new Date().toISOString(),
        redemptionStatus: 'Applied Successfully'
      });
    }

    // 3. Update loyalty points
    if (user) {
        const newBalance = (userPoints - pointsToRedeem) + pointsEarned;
        updateProfile({ loyaltyPoints: newBalance });
    }

    setEarnedPoints(pointsEarned);
    clearCart();
    setIsProcessing(false);
    setStep(3);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 flex items-center justify-between">
           <h1 className="text-3xl font-bold font-serif text-neutral-900">Checkout</h1>
           <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-2 w-8 rounded-full transition-all duration-300 ${step >= s ? 'bg-amber-500' : 'bg-neutral-200'}`} />
              ))}
           </div>
        </div>

        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-neutral-100">
          
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold font-serif text-neutral-900 mb-6">1. Shipping Details</h2>
              {user?.isBlocked && (
                  <div id="checkout-block-restriction" className="mb-6 bg-red-105 bg-red-100 text-red-700 p-4 rounded-xl flex items-center text-sm font-black border border-red-200">
                      <AlertCircle size={18} className="mr-2 flex-shrink-0"/> Your account has been temporarily restricted. Please contact support.
                  </div>
              )}
              {error && !user?.isBlocked && (
                  <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-center text-sm font-bold border border-red-100">
                      <AlertCircle size={18} className="mr-2"/> {error}
                  </div>
              )}
              <form onSubmit={(e) => {
                if (user?.isBlocked) {
                  e.preventDefault();
                  setError('Your account has been temporarily restricted. Please contact support.');
                  return;
                }
                handleAddressSubmit(e);
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-2">Full Name</label>
                    <input required type="text" className="w-full border-2 border-neutral-100 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 text-black bg-white transition-colors" value={address.fullName} onChange={e => setAddress({...address, fullName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-2">Mobile Number</label>
                    <input required type="tel" maxLength={10} placeholder="10-digit mobile" className="w-full border-2 border-neutral-100 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 text-black bg-white transition-colors" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value.replace(/\D/g, '')})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-2">Street Address</label>
                  <input required type="text" className="w-full border-2 border-neutral-100 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 text-black bg-white transition-colors" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-2">City</label>
                    <input required type="text" className="w-full border-2 border-neutral-100 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 text-black bg-white transition-colors" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest mb-2">ZIP Code</label>
                    <input required type="text" maxLength={6} className="w-full border-2 border-neutral-100 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 text-black bg-white transition-colors" value={address.zip} onChange={e => setAddress({...address, zip: e.target.value.replace(/\D/g, '')})} />
                  </div>
                </div>
                <div className="pt-6">
                  <button type="submit" className="w-full bg-neutral-900 text-amber-500 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl text-lg">Continue to Payment</button>
                </div>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold font-serif text-neutral-900 mb-6">2. Payment & Offers</h2>
              
              <div className="mb-8 p-6 bg-white rounded-2xl border-2 border-neutral-100">
                  <div className="flex items-center gap-2 mb-4">
                      <Ticket className="text-amber-500" size={24} />
                      <h3 className="text-lg font-bold font-serif text-neutral-900">Available Coupons for You</h3>
                  </div>
                  <div className="space-y-3">
                      {coupons.filter(c => c.isActive && (!c.isUserSpecific || c.userId === user.id)).map((coupon) => {
                         const usagesStr = localStorage.getItem('sjsm_coupon_usages') || '[]';
                         let isUsed = false;
                         try {
                           const usagesList = JSON.parse(usagesStr);
                           isUsed = usagesList.some((u: any) => u.userId === user.id && u.couponCode.toUpperCase() === coupon.code.toUpperCase());
                         } catch (e) {
                           console.error(e);
                         }

                         return (
                           <div key={coupon.id} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${couponCode === coupon.code ? 'border-amber-500 bg-amber-50' : 'border-neutral-100 bg-neutral-50'}`}>
                              <div>
                                 <div className="flex items-center gap-2">
                                   <p className="font-black text-amber-600 text-sm tracking-wider">{coupon.code}</p>
                                   <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">{coupon.type}</span>
                                   {coupon.festivalName && (
                                     <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold tracking-wide">🎉 {coupon.festivalName}</span>
                                   )}
                                 </div>
                                 <p className="text-xs text-neutral-500 font-medium mt-1">Get {coupon.discountPercentage}% OFF (Max discount: ₹{coupon.maxDiscountLimit}, Min Spend: ₹{coupon.minimumOrderValue})</p>
                                 <p className="text-[10px] text-neutral-400 font-mono mt-0.5 font-bold">Valid: {coupon.startDate} to {coupon.expiryDate}</p>
                              </div>
                              {couponCode === coupon.code ? (
                                <button onClick={() => { removeCoupon(); setCouponMessage(null); setTypedCoupon(''); }} className="text-xs font-bold text-red-500 hover:text-red-700">Remove</button>
                              ) : isUsed ? (
                                <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">Redeemed</span>
                              ) : (
                                <button onClick={() => { handleApplyCoupon(coupon.code); setTypedCoupon(coupon.code); }} className="bg-amber-500 text-black px-4 py-1.5 rounded-lg text-xs font-black uppercase hover:bg-amber-400">Apply</button>
                              )}
                           </div>
                         );
                      })}
                  </div>

                  <div className="mt-6 pt-6 border-t border-neutral-100">
                    <p className="text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider">Have a promo code? Enter it below</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="PROMO CODE" 
                        value={typedCoupon}
                        onChange={(e) => setTypedCoupon(e.target.value.toUpperCase())}
                        className="flex-1 bg-white border-2 border-neutral-150 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-amber-500 text-black"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (!typedCoupon.trim()) {
                            setCouponMessage({ type: 'error', text: 'Invalid coupon code.' });
                            return;
                          }
                          handleApplyCoupon(typedCoupon.trim());
                        }}
                        className="bg-neutral-900 text-amber-500 hover:bg-black px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {couponMessage && (
                    <div className={`mt-4 p-4 rounded-xl border-2 ${couponMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      {couponMessage.type === 'success' ? (
                        <div className="space-y-2">
                          <p className="font-extrabold text-green-700 text-sm flex items-center gap-1.5">
                            <CheckCircle size={16} /> Coupon Applied Successfully
                          </p>
                          <div className="text-xs space-y-1.5 pl-5.5 text-neutral-700">
                            <div><span className="font-bold text-neutral-500">Coupon Code:</span> <span className="font-mono font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{couponCode || typedCoupon}</span></div>
                            <div><span className="font-bold text-neutral-500">Discount Amount:</span> <span className="font-black text-green-600 text-sm">₹{discount}</span></div>
                            <div><span className="font-bold text-neutral-500">Final Total:</span> <span className="font-black text-neutral-950 text-sm font-serif">₹{finalTotal}</span></div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs font-bold text-red-700">{couponMessage.text}</p>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              <div className="bg-neutral-50 p-6 rounded-2xl mb-8 border border-neutral-200">
                  <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-neutral-600 text-sm">
                          <span>Items Subtotal</span>
                          <span className="font-bold">₹{cartTotal}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600 text-sm">
                          <span>Shipping Fee</span>
                          <span className="font-bold">{shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}</span>
                      </div>
                      {discount > 0 && (
                          <div className="flex justify-between text-green-600 font-bold text-sm">
                              <span>Coupon Discount</span>
                              <span>-₹{discount}</span>
                          </div>
                      )}
                      {pointsToRedeem > 0 && (
                          <div className="flex justify-between text-amber-600 font-bold text-sm">
                              <span>Loyalty Points used</span>
                              <span>-₹{pointsToRedeem}</span>
                          </div>
                      )}
                  </div>

                  <div className="border-t-2 border-neutral-200 pt-4 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">Total Amount Payable</span>
                      <span className="text-5xl font-black text-amber-600 font-serif">₹{finalTotal}</span>
                  </div>

                  <div className="mt-6 p-4 bg-white border-2 border-amber-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="bg-amber-500 p-2 rounded-lg"><Gift size={20} className="text-black"/></div>
                          <div>
                              <p className="text-sm font-bold text-neutral-900">Use Loyalty Points</p>
                              <p className="text-xs text-neutral-500">You have {userPoints} points</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => setRedeemPoints(!redeemPoints)}
                        disabled={userPoints === 0}
                        className={`w-12 h-6 rounded-full transition-all relative ${redeemPoints ? 'bg-amber-500' : 'bg-neutral-300'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${redeemPoints ? 'right-1' : 'left-1'}`} />
                      </button>
                  </div>
              </div>

              {error && (
                  <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-center text-sm font-bold border border-red-100">
                      <AlertCircle size={18} className="mr-2"/> {error}
                  </div>
              )}

              <div className="space-y-4 mb-8">
                <div 
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-4 rounded-xl cursor-pointer flex items-center justify-between border-2 transition-all ${paymentMethod === 'UPI' ? 'border-amber-500 bg-amber-50' : 'border-neutral-100'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${paymentMethod === 'UPI' ? 'bg-amber-500 text-black' : 'bg-neutral-100 text-neutral-400'}`}><Wallet size={20}/></div>
                    <span className="font-bold text-neutral-900">UPI (Mobile No @ UPI)</span>
                  </div>
                  {paymentMethod === 'UPI' && <CheckCircle className="text-amber-500" size={20}/>}
                </div>
                {paymentMethod === 'UPI' && (
                    <div className="animate-fade-in pl-14">
                        <input 
                            type="text" 
                            placeholder="1234567890@upi" 
                            className="w-full border-2 border-neutral-100 rounded-xl py-2 px-4 focus:outline-none focus:border-amber-500 text-black bg-white"
                            value={upiId}
                            onChange={e => setUpiId(e.target.value)}
                        />
                        <p className="text-[10px] text-neutral-400 mt-1">Enter exactly 10-digit mobile number before @upi</p>
                    </div>
                )}
                
                <div 
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-4 rounded-xl cursor-pointer flex items-center justify-between border-2 transition-all ${paymentMethod === 'CARD' ? 'border-amber-500 bg-amber-50' : 'border-neutral-100'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${paymentMethod === 'CARD' ? 'bg-amber-500 text-black' : 'bg-neutral-100 text-neutral-400'}`}><CreditCard size={20}/></div>
                    <span className="font-bold text-neutral-900">Credit / Debit Card</span>
                  </div>
                  {paymentMethod === 'CARD' && <CheckCircle className="text-amber-500" size={20}/>}
                </div>
                
                {paymentMethod === 'CARD' && (
                  <div className="animate-fade-in space-y-3 pl-14 pt-2">
                    <div className="grid grid-cols-1 gap-3">
                      <input 
                        type="text" 
                        placeholder="Card Number (16 digits)" 
                        maxLength={19}
                        className="w-full border-2 border-neutral-100 rounded-xl py-2 px-4 focus:outline-none focus:border-amber-500 text-black bg-white"
                        value={cardDetails.number}
                        onChange={e => {
                           const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                           setCardDetails({...cardDetails, number: val});
                        }}
                      />
                      <input 
                        type="text" 
                        placeholder="Cardholder Name" 
                        className="w-full border-2 border-neutral-100 rounded-xl py-2 px-4 focus:outline-none focus:border-amber-500 text-black bg-white"
                        value={cardDetails.name}
                        onChange={e => setCardDetails({...cardDetails, name: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          maxLength={5}
                          className="w-full border-2 border-neutral-100 rounded-xl py-2 px-4 focus:outline-none focus:border-amber-500 text-black bg-white"
                          value={cardDetails.expiry}
                          onChange={e => {
                             let val = e.target.value.replace(/\D/g, '');
                             if(val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2,4);
                             setCardDetails({...cardDetails, expiry: val});
                          }}
                        />
                        <input 
                          type="password" 
                          placeholder="CVV" 
                          maxLength={3}
                          className="w-full border-2 border-neutral-100 rounded-xl py-2 px-4 focus:outline-none focus:border-amber-500 text-black bg-white"
                          value={cardDetails.cvv}
                          onChange={e => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '')})}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 font-sans">
                  <button 
                    onClick={handlePaymentSubmit} 
                    disabled={isProcessing}
                    className="w-full bg-neutral-900 text-amber-500 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl text-lg flex items-center justify-center cursor-pointer"
                  >
                    {isProcessing ? <><Loader2 className="animate-spin mr-2"/> Processing Payment...</> : 'Pay Securely via Razorpay'}
                  </button>
                  <button 
                    onClick={() => setStep(1)} 
                    className="w-full flex items-center justify-center gap-2 py-4 text-neutral-700 font-black uppercase tracking-widest hover:bg-neutral-50 transition-all border-2 border-neutral-100 rounded-xl shadow-sm cursor-pointer"
                  >
                    <ChevronLeft size={18}/> Back to Address
                  </button>
              </div>
            </div>
          )}

          {/* Razorpay Simulated Secured Gateway Popup Overlay */}
          {isRazorpayOpen && (
            <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm text-neutral-800">
              <div className="bg-[#121c2c] text-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col font-sans">
                
                {/* Header branding */}
                <div className="bg-[#0f1724] p-5 border-b border-neutral-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center font-bold text-sm tracking-tighter text-white">
                      R
                    </div>
                    <div>
                      <h4 className="text-sm font-bold tracking-tight text-white leading-none">Razorpay Secure</h4>
                      <span className="text-[10px] text-neutral-400 font-medium font-sans">Shri Jain Stationery Mart</span>
                    </div>
                  </div>
                  <div className="text-right font-sans">
                    <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-widest leading-none mb-1">Amount</span>
                    <span className="text-lg font-black text-amber-400 leading-none">₹{finalTotal}</span>
                  </div>
                </div>

                {/* Simulated Bank/Card status */}
                {razorpayState === 'idle' && (
                  <div className="p-6 space-y-6">
                    <div className="bg-blue-950/40 p-4 border border-blue-900/30 rounded-xl">
                      <p className="text-xs text-blue-300 font-bold leading-relaxed font-sans">
                        🔒 Secure checkout processed via Razorpay. Your transaction is encrypted and authenticated.
                      </p>
                    </div>

                    {/* Choose method */}
                    <div className="grid grid-cols-2 gap-2 border bg-[#1a2638] border-neutral-800 p-1 rounded-lg text-xs font-bold text-center">
                      <button 
                        onClick={() => setRazorpayMethod('UPI')}
                        className={`py-2 rounded-md transition-all ${razorpayMethod === 'UPI' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-400'}`}
                      >
                        UPI / QR
                      </button>
                      <button 
                        onClick={() => setRazorpayMethod('CARD')}
                        className={`py-2 rounded-md transition-all ${razorpayMethod === 'CARD' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-400'}`}
                      >
                        Card
                      </button>
                    </div>

                    <div className="space-y-4">
                      {razorpayMethod === 'UPI' && (
                        <div className="space-y-3 font-sans">
                          <div className="p-3 bg-neutral-900/40 rounded-xl border border-neutral-800">
                            <label className="text-[10px] text-neutral-400 font-bold block mb-1.5 uppercase">UPI Address Configured</label>
                            <p className="text-sm font-mono text-amber-300 font-bold">{upiId || `${user?.phone || '9876543210'}@upi`}</p>
                          </div>
                        </div>
                      )}

                      {razorpayMethod === 'CARD' && (
                        <div className="space-y-3 font-sans">
                          <div className="p-3 bg-neutral-900/40 rounded-xl border border-neutral-800 space-y-2">
                            <label className="text-[10px] text-neutral-400 font-bold block uppercase leading-none">Credit Card</label>
                            <p className="text-sm font-mono text-neutral-200">{cardDetails.number || '4111 1111 1111 1111'}</p>
                            <div className="flex justify-between text-xs text-neutral-400 font-mono">
                              <span>Expiry: {cardDetails.expiry || '12/29'}</span>
                              <span>CVV: ***</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-neutral-800 flex gap-3 text-xs font-bold font-sans">
                      <button 
                        type="button"
                        onClick={() => setIsRazorpayOpen(false)}
                        className="flex-1 bg-neutral-900 text-neutral-400 hover:text-white py-3 border border-neutral-800 rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setRazorpayState('authorizing');
                          setTimeout(() => {
                            setRazorpayState('completed');
                          }, 2500);
                        }}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-500 transition shadow-lg flex items-center justify-center gap-1.5"
                      >
                        Pay ₹{finalTotal} Securely
                      </button>
                    </div>
                  </div>
                )}

                {razorpayState === 'authorizing' && (
                  <div className="p-8 text-center space-y-6">
                    <Loader2 size={44} className="text-blue-500 animate-spin mx-auto animate-pulse" />
                    <div>
                      <h4 className="text-base font-bold text-white font-serif">Authorizing Transaction</h4>
                      <p className="text-xs text-neutral-400 mt-2 font-mono">Securing a connection to complete your checkout safely...</p>
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono bg-[#162131]/40 border border-neutral-800 py-2 rounded">
                      Transaction Ref ID: {generatedPayId}
                    </div>
                  </div>
                )}

                {razorpayState === 'completed' && (
                  <div className="p-8 text-center space-y-6">
                    <div className="h-16 w-16 bg-green-950 text-green-400 rounded-full border border-green-500/20 flex items-center justify-center mx-auto text-2xl font-bold animate-pulse">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white font-serif">Payment Succeeded</h4>
                      <p className="text-xs text-neutral-400 mt-1 font-sans">Verification completed! Your transaction was captured successfully.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={finalizeRazorpayOrder}
                      className="w-full bg-green-600 text-white hover:bg-green-500 font-bold py-3.5 rounded-xl transition shadow-lg font-sans"
                    >
                      Proceed to Order Confirmation
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-12 text-center py-20">
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-8 border-4 border-green-200">
                <CheckCircle className="h-14 w-14 text-green-600" />
              </div>
              <h2 className="text-4xl font-bold text-neutral-900 mb-4 font-serif">Order Confirmed!</h2>
              <p className="text-neutral-500 mb-8 max-w-sm mx-auto">Your stationery is being packed with care. You'll receive updates on your registered phone number.</p>
              
              <div className="inline-flex items-center gap-3 bg-amber-50 border-2 border-amber-200 px-6 py-3 rounded-2xl mb-12">
                  <Gift className="text-amber-600" size={24} />
                  <span className="text-amber-900 font-black text-lg tracking-tight">+{earnedPoints} Loyalty Points Added!</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                <button onClick={() => navigate('/shop')} className="px-6 py-4 border-2 border-neutral-200 rounded-xl text-neutral-700 font-black uppercase tracking-widest hover:bg-neutral-50 transition-all text-sm">Keep Browsing</button>
                <button onClick={() => navigate('/profile')} className="px-6 py-4 bg-amber-500 rounded-xl text-black font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg text-sm">View Order Info</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Checkout;
