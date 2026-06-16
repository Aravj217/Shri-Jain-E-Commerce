
import React from 'react';
import { MapPin, Phone, Instagram, Facebook } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-neutral-300 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="bg-amber-500 text-black w-12 h-10 flex items-center justify-center rounded-lg shadow-lg">
                 <div className="flex flex-col items-center leading-none p-1">
                    <span className="font-serif font-bold text-lg leading-none">SJSM</span>
                    <span className="text-[0.4rem] font-bold">EST. 1980</span>
                 </div>
               </div>
               <h3 className="text-white text-xl font-bold font-serif tracking-wide">Shri Jain<br/><span className="text-sm font-sans font-normal text-amber-500">Stationery Mart</span></h3>
            </div>
            <p className="text-neutral-400 leading-relaxed text-sm">
              Kota's premier destination for quality stationery. Wholesale and retail suppliers of art materials, office supplies, and school essentials.
              <br/><span className="text-amber-500 font-bold mt-2 block">Serving since 1980</span>
            </p>
            <div className="flex space-x-4 pt-2">
              <a 
                href="https://www.facebook.com/shreejainstationerymart/" 
                target="_blank" 
                rel="noreferrer" 
                className="bg-neutral-800 p-2.5 rounded-full hover:bg-[#1877F2] hover:text-white transition-all duration-300 text-neutral-400"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://www.instagram.com/luxury.stationery?igsh=N240d3VkbXpzemsy" 
                target="_blank" 
                rel="noreferrer" 
                className="bg-neutral-800 p-2.5 rounded-full hover:bg-[#E4405F] hover:text-white transition-all duration-300 text-neutral-400"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-bold mb-6 font-serif border-b border-amber-500/50 inline-block pb-1">Contact Information</h3>
            <div className="space-y-4">
              <a 
                href="https://maps.app.goo.gl/MhGwS7MUXsoFYLQw9?g_st=aw" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-start hover:text-amber-400 transition-colors group"
              >
                <MapPin size={20} className="mr-3 flex-shrink-0 text-amber-500 group-hover:text-amber-400 mt-1" />
                <span className="text-sm leading-relaxed">Arya Samaj Road,<br/>Rampura, Kota, Rajasthan</span>
              </a>
              <div className="flex items-center group">
                <Phone size={20} className="mr-3 flex-shrink-0 text-amber-500" />
                <span className="text-sm">9414231059</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-bold mb-6 font-serif border-b border-amber-500/50 inline-block pb-1">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#/" className="hover:text-amber-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>Home</a></li>
              <li><a href="#/shop" className="hover:text-amber-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>Shop Catalog</a></li>
              <li><a href="#/cart" className="hover:text-amber-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>My Cart</a></li>
              <li><a href="#/login" className="hover:text-amber-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>Login / Signup</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-800 mt-12 pt-8 text-xs text-center text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Shri Jain Stationery Mart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
