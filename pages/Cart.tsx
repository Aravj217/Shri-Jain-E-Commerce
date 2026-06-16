
import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart, useAuth } from '../services/store';

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart, shippingCharge, cartError } = useCart();
  const { user } = useAuth();

  const isUserBlocked = user?.isBlocked === true;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Your cart is empty</h2>
          <p className="text-neutral-600 mb-8">Looks like you haven't added anything yet.</p>
          <Link 
            to="/shop" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-black bg-amber-400 hover:bg-amber-500 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold font-serif text-neutral-900 mb-8">Shopping Cart</h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          <div className="lg:col-span-8">
            <div className="bg-white shadow-md rounded-lg overflow-hidden border border-neutral-200">
              <ul className="divide-y divide-neutral-200">
                {cart.map((item) => (
                  <li key={item.id} className="p-6 flex flex-col sm:flex-row">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-gray-50">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" />
                    </div>

                    <div className="ml-4 flex-1 flex flex-col">
                      <div className="flex justify-between text-base font-bold text-neutral-900">
                        <h3 className="font-serif">{item.name}</h3>
                        <p className="ml-4">₹{item.price * item.quantity}</p>
                      </div>
                      <p className="mt-1 text-sm text-neutral-500">{item.category}</p>

                      <div className="flex-1 flex items-end justify-between text-sm mt-4">
                         {/* High contrast quantity controls */}
                         <div className="flex items-center border-2 border-neutral-300 rounded-md bg-white">
                           <button 
                             onClick={() => updateQuantity(item.id, item.quantity - 1)}
                             className="p-2 hover:bg-neutral-100 text-black font-bold border-r border-neutral-300 active:bg-neutral-200"
                             aria-label="Decrease quantity"
                           >
                             <Minus size={16} strokeWidth={3} />
                           </button>
                           <span className="px-4 font-bold text-black text-lg">{item.quantity}</span>
                           <button 
                             onClick={() => updateQuantity(item.id, item.quantity + 1)}
                             className="p-2 hover:bg-neutral-100 text-black font-bold border-l border-neutral-300 active:bg-neutral-200"
                             aria-label="Increase quantity"
                           >
                             <Plus size={16} strokeWidth={3} />
                           </button>
                         </div>

                        <button 
                          type="button" 
                          onClick={() => removeFromCart(item.id)}
                          className="font-medium text-red-600 hover:text-red-700 flex items-center"
                        >
                          <Trash2 size={16} className="mr-1" /> Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="bg-neutral-50 px-6 py-4 flex justify-between items-center border-t border-neutral-200">
                 <button onClick={clearCart} className="text-sm text-neutral-500 hover:text-neutral-900 underline font-medium">Clear Cart</button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="bg-white shadow-md rounded-lg p-6 border border-neutral-200">
              <h2 className="text-lg font-bold text-neutral-900 mb-4 font-serif">Order Summary</h2>
              <div className="flow-root">
                <dl className="-my-4 divide-y divide-neutral-200">
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-neutral-600">Subtotal</dt>
                    <dd className="font-medium text-neutral-900">₹{cartTotal}</dd>
                  </div>
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-neutral-600">Shipping</dt>
                    <dd className="font-medium text-neutral-900">
                        {shippingCharge === 0 ? <span className="text-green-600">Free</span> : `₹${shippingCharge}`}
                    </dd>
                  </div>
                  {shippingCharge > 0 && (
                      <p className="text-xs text-neutral-500 mb-2">Order above ₹2000 for free shipping.</p>
                  )}
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-base font-bold text-neutral-900">Order Total</dt>
                    <dd className="text-xl font-bold text-amber-600">₹{cartTotal + shippingCharge}</dd>
                  </div>
                </dl>
              </div>

              {isUserBlocked && (
                <div id="cart-blocked-warning" className="mt-4 bg-red-100 border border-red-300 text-red-700 text-xs font-black p-4 rounded-xl flex items-center justify-center text-center">
                  ⚠️ Your account has been temporarily restricted. Please contact support.
                </div>
              )}

              {cartError && !isUserBlocked && (
                <div id="cart-qty-warning-box" className="mt-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-4 rounded-xl flex items-center justify-center text-center">
                  ⚠️ {cartError}
                </div>
              )}

              <div className="mt-6">
                {isUserBlocked ? (
                  <button
                    disabled
                    className="w-full flex justify-center items-center px-6 py-4 border border-transparent rounded-lg shadow-sm text-base font-bold text-neutral-400 bg-neutral-200 cursor-not-allowed uppercase tracking-wide"
                  >
                    Checkout Restricted <ArrowRight className="ml-2" size={18} />
                  </button>
                ) : cartError ? (
                  <button
                    disabled
                    className="w-full flex justify-center items-center px-6 py-4 border border-transparent rounded-md shadow-sm text-base font-bold text-neutral-400 bg-neutral-200 cursor-not-allowed uppercase tracking-wide"
                  >
                    Proceed to Checkout <ArrowRight className="ml-2" size={18} />
                  </button>
                ) : (
                  <Link
                    to="/checkout"
                    className="w-full flex justify-center items-center px-6 py-4 border border-transparent rounded-md shadow-sm text-base font-bold text-black bg-amber-400 hover:bg-amber-500 transition-colors uppercase tracking-wide"
                  >
                    Proceed to Checkout <ArrowRight className="ml-2" size={18} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
