
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Leaf, BadgeIndianRupee, MapPin } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-black text-white overflow-hidden h-[600px] flex items-center">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&q=80&w=1920" 
            alt="Stationery Background" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500 text-black text-sm font-bold mb-6 tracking-wider uppercase border border-amber-400">
              Premier Wholesaler & Retailer
            </span>
            <h1 className="text-5xl md:text-7xl font-bold font-serif tracking-tight mb-6 text-white leading-tight">
              Shri Jain <span className="text-amber-400">Stationery Mart</span>
              <span className="block text-2xl mt-2 font-sans font-light text-amber-200/80 tracking-widest">EST. 1980</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 font-light leading-relaxed">
              Your trusted partner for premium office supplies, school essentials, and artistic tools in Kota. Unbeatable wholesale prices for bulk orders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/shop" 
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-lg text-black bg-amber-400 hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_25px_rgba(251,191,36,0.6)]"
              >
                Browse Catalog <ArrowRight className="ml-2" size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4 font-serif">Why Shop With Us?</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">We combine decades of experience with a modern selection of products.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-8 bg-neutral-50 rounded-2xl text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-neutral-200 group">
              <div className="w-16 h-16 mx-auto bg-neutral-900 text-amber-400 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:bg-amber-400 group-hover:text-black transition-colors">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3 font-serif text-neutral-900">Premium Brands</h3>
              <p className="text-neutral-600 leading-relaxed">Authorized dealer for top stationery brands ensuring authenticity and superior performance.</p>
            </div>
            <div className="p-8 bg-neutral-50 rounded-2xl text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-neutral-200 group">
               <div className="w-16 h-16 mx-auto bg-neutral-900 text-amber-400 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:bg-amber-400 group-hover:text-black transition-colors">
                <Leaf size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3 font-serif text-neutral-900">Eco-Conscious</h3>
              <p className="text-neutral-600 leading-relaxed">We prioritize sustainable products, recycled paper, and eco-friendly art supplies.</p>
            </div>
             <div className="p-8 bg-neutral-50 rounded-2xl text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-neutral-200 group">
               <div className="w-16 h-16 mx-auto bg-neutral-900 text-amber-400 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:bg-amber-400 group-hover:text-black transition-colors">
                <BadgeIndianRupee size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3 font-serif text-neutral-900">Wholesale Prices</h3>
              <p className="text-neutral-600 leading-relaxed">Get the best rates in Kota. Special discounts for bulk purchases, schools, and offices.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Location / Call to Action */}
      <div className="bg-neutral-900 py-20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-amber-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-amber-600 rounded-full opacity-10 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
           <div className="text-center max-w-3xl mx-auto">
               <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6 leading-tight text-white">Visit Shri Jain Stationery Mart Today</h2>
               <p className="text-lg text-neutral-300 mb-8 leading-relaxed">
                 Experience the texture of premium paper and test our pens before you buy. Located centrally in Kota for your convenience.
               </p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                 <a href="https://maps.app.goo.gl/MhGwS7MUXsoFYLQw9?g_st=aw" target="_blank" rel="noreferrer" className="flex items-center group">
                   <div className="bg-amber-500 p-2.5 rounded-lg mr-4 group-hover:bg-amber-400 transition-colors">
                     <MapPin className="text-black" size={24} />
                   </div>
                   <div className="text-left">
                      <h4 className="font-bold text-lg text-amber-400">Our Location</h4>
                      <p className="text-neutral-300 mt-1">Arya Samaj Road, Kota, Rajasthan</p>
                   </div>
                 </a>
               </div>
               <a 
                 href="https://maps.app.goo.gl/MhGwS7MUXsoFYLQw9?g_st=aw" 
                 target="_blank" 
                 rel="noreferrer"
                 className="inline-block bg-white text-black font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-neutral-100 transition-colors border-2 border-white"
               >
                 Get Directions
               </a>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
