import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star, Search, Filter } from 'lucide-react';
import { useAuth } from '../services/store';
import { useCart } from '../services/store';
import { Product } from '../types';
import { useNavigate } from 'react-router-dom';

const Shop: React.FC = () => {
  const { addToCart } = useCart();
  const { products } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

  const categories = [
    'All',
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

  useEffect(() => {
    // Only display active, non-disabled products
    let result = products.filter(p => p.status !== 'Disabled');

    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, products]);

  return (
    <div className="bg-neutral-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="text-amber-600 font-bold tracking-[0.2em] uppercase text-sm">Wholesale & Retail</span>
          <h1 className="text-4xl font-bold font-serif text-black mt-2">Our Collection</h1>
          <p className="mt-4 text-neutral-600 max-w-2xl mx-auto">Browse our wide collection of premium stationery. Quality guaranteed for professionals, students, and artists.</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-10 flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-neutral-100">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           
           <div className="w-full md:w-64">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-black cursor-pointer appearance-none"
                style={{backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto', paddingRight: '2.5em'}}
              >
                {categories.map(cat => (
                   <option key={cat} value={cat} className="py-1">{cat}</option>
                ))}
              </select>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={() => addToCart(product)} 
              onClick={() => navigate(`/product/${product.id}`)}
            />
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
           <div className="text-center py-20">
              <p className="text-neutral-500 text-lg">No products found matching your criteria.</p>
           </div>
        )}
      </div>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onClick }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full border border-neutral-100 group cursor-pointer" onClick={onClick}>
      <div className="relative h-60 bg-gray-100 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <div className="bg-black/80 backdrop-blur-sm px-3 py-1 rounded-md text-xs font-bold text-amber-400 shadow-sm uppercase tracking-wide">
              {product.category}
          </div>
          {product.stock <= 0 && (
            <div className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-black shadow-sm uppercase tracking-wide">
                OUT OF STOCK
            </div>
          )}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold font-serif text-neutral-900 leading-tight group-hover:text-amber-600 transition-colors">{product.name}</h3>
        </div>
        <div className="flex items-center text-amber-500 text-xs font-bold mb-3">
            <Star size={14} className="fill-current mr-1" />
            <span className="text-neutral-700 ml-1">{product.rating} <span className="text-neutral-400 font-normal">({product.reviews} reviews)</span></span>
        </div>
        <p className="text-neutral-500 text-sm mb-5 line-clamp-2 flex-1 leading-relaxed">{product.description}</p>
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-neutral-100">
          <span className="text-2xl font-bold text-neutral-900">₹{product.price}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); if (product.stock > 0) onAddToCart(); }}
            disabled={product.stock <= 0}
            className={`flex items-center justify-center p-2.5 rounded-lg transition-all duration-300 shadow-md ${product.stock <= 0 ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-neutral-900 text-white hover:bg-amber-500 hover:text-black'}`}
            aria-label="Add to cart"
          >
            <ShoppingCart size={18} />
            <span className="ml-2 text-sm font-semibold">{product.stock <= 0 ? 'Out' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Shop;