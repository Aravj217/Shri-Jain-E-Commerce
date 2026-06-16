
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { useCart } from '../services/store';
import { useAuth } from '../services/store';

const Navbar: React.FC = () => {
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const adminEmail = process.env.ADMIN_EMAIL || 'shrijains@gmail.com';

  const isActive = (path: string) => location.pathname === path ? "text-amber-600 font-bold border-b-2 border-amber-500" : "text-neutral-600 hover:text-amber-600 transition-colors font-medium";

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
               {/* Logo Container - Full Black Background, Gold Text */}
               <div className="bg-black text-amber-500 w-16 h-14 flex items-center justify-center rounded-md shadow-lg group-hover:bg-neutral-900 transition-colors border border-amber-500/50">
                 <div className="flex flex-col items-center leading-none">
                    <span className="font-serif font-black text-xl tracking-widest">SJSM</span>
                    <span className="text-[0.5rem] mt-0.5 text-amber-200">EST. 1980</span>
                 </div>
               </div>
               <div className="flex flex-col">
                 <span className="font-serif font-bold text-xl tracking-tight text-neutral-900 leading-none">Shri Jain</span>
                 <span className="text-xs uppercase tracking-[0.2em] text-amber-600 font-bold mt-1">Stationery Mart</span>
               </div>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`py-2 ${isActive('/')}`}>Home</Link>
            <Link to="/shop" className={`py-2 ${isActive('/shop')}`}>Shop</Link>
            {user?.email?.toLowerCase() === adminEmail.toLowerCase() && (
              <Link to="/admin" className={`py-2 ${isActive('/admin')} text-amber-600 font-bold`}>Admin</Link>
            )}
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 text-neutral-600 hover:text-amber-600 py-2 font-medium">
                  <UserIcon size={20} />
                  <span>{user.name}</span>
                </button>
                <div className="absolute right-0 w-48 mt-2 origin-top-right bg-white border border-neutral-200 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                  <div className="py-1">
                    {user?.email?.toLowerCase() === adminEmail.toLowerCase() && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-amber-600 font-semibold hover:bg-amber-50">Admin Panel</Link>
                    )}
                    <Link to="/profile" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-amber-50 hover:text-amber-700">My Profile</Link>
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2">
                       <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login" className={`py-2 ${isActive('/login')}`}>Login</Link>
            )}
            <Link to="/cart" className="relative p-2 text-neutral-600 hover:text-amber-600 transition-colors">
              <ShoppingBag size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold leading-none text-neutral-900 transform bg-amber-400 rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          <div className="flex items-center md:hidden">
            <Link to="/cart" className="p-2 mr-4 text-neutral-600 relative">
               <ShoppingBag size={24} />
               {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-neutral-900 transform translate-x-1/4 -translate-y-1/4 bg-amber-400 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-amber-600 hover:bg-amber-50" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/shop" className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-amber-600 hover:bg-amber-50" onClick={() => setIsMenuOpen(false)}>Shop</Link>
            {user?.email?.toLowerCase() === adminEmail.toLowerCase() && (
              <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-bold text-amber-600 hover:bg-amber-50" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>
            )}
            {user ? (
               <>
                <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-amber-600 hover:bg-amber-50" onClick={() => setIsMenuOpen(false)}>My Profile</Link>
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-amber-600 hover:bg-amber-50">Logout</button>
               </>
            ) : (
                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:text-amber-600 hover:bg-amber-50" onClick={() => setIsMenuOpen(false)}>Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
