/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Store, 
  PlusCircle, 
  Trash2, 
  LogOut, 
  User as UserIcon, 
  ShoppingBag, 
  TrendingDown, 
  AlertTriangle,
  ChevronRight,
  CreditCard,
  QrCode,
  Building2,
  DollarSign,
  Package,
  Clock,
  TrendingUp,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'consumer' | 'vendor';
  phoneNumber?: string;
  address?: {
    street: string;
    zipCode: string;
    city: string;
  };
  businessName?: string;
  businessType?: string;
  licenseNumber?: string;
  paymentScanner?: string;
  savedAmount?: number;
}

interface ListingItem {
  name: string;
  quantity: number;
  unit: string;
  originalPrice: number;
  discountedPrice: number;
  expiryDate: string;
}

interface Listing {
  _id: string;
  title: string;
  description: string;
  category: string;
  items: ListingItem[];
  price: number;
  originalPrice: number;
  expiryDate: string;
  address: string;
  latitude?: number;
  longitude?: number;
  image: string;
  dietaryTags?: string[];
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  vendorId: {
    _id: string;
    name: string;
    businessName?: string;
    businessType?: string;
    licenseNumber?: string;
    paymentScanner?: string;
    phoneNumber?: string;
    email?: string;
  };
}

interface Order {
  _id: string;
  consumerName: string;
  amount: number;
  status: 'pending' | 'preparing' | 'delivered' | 'completed';
  createdAt: string;
  listingId: {
    title: string;
  };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [view, setView] = useState<'home' | 'marketplace' | 'dashboard' | 'checkout' | 'login' | 'register' | 'details' | 'add-listing'>('home');
  const [role, setRole] = useState<'consumer' | 'vendor'>('consumer');
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedItem, setSelectedItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [street, setStreet] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Restaurant');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [scanner, setScanner] = useState('');

  // Vendor Stats
  const [vendorStats, setVendorStats] = useState({ listings: [], orders: [], ordersCount: 0, profit: 0 });
  const [consumerStats, setConsumerStats] = useState({ savedAmount: 0 });

  useEffect(() => {
    if (token) {
      fetchListings();
      if (user?.role === 'vendor') fetchVendorStats();
      else if (user?.role === 'consumer') fetchConsumerStats();
    }
  }, [token, user?.role]);

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/listings');
      const data = await res.json();
      setListings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVendorStats = async () => {
    try {
      const res = await fetch('/api/vendor/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setVendorStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConsumerStats = async () => {
    try {
      const res = await fetch('/api/consumer/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setConsumerStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        setView('home');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          role, 
          name, 
          phoneNumber,
          address: { street, zipCode, city },
          businessName: role === 'vendor' ? businessName : undefined,
          businessType: role === 'vendor' ? businessType : undefined,
          licenseNumber: role === 'vendor' ? licenseNumber : undefined,
          paymentScanner: scanner
        })
      });
      if (res.ok) {
        setView('login');
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setView('home');
  };

  const handleBuyNow = (item: Listing) => {
    setSelectedItem(item);
    setView('checkout');
  };

  const handlePayment = async (method: string) => {
    if (!selectedItem || !token) return;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ listingId: selectedItem._id, paymentMethod: method })
      });
      if (res.ok) {
        alert('Payment Successful! Order Placed.');
        setView('marketplace');
        fetchListings();
        fetchConsumerStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    const dietaryTags = [];
    if (data.isVegan) dietaryTags.push('Vegan');
    if (data.isVegetarian) dietaryTags.push('Vegetarian');
    if (data.isOrganic) dietaryTags.push('Organic');
    if (data.isGlutenFree) dietaryTags.push('Gluten Free');

    // Simple item parsing: "Item 1, Item 2" -> [{name: "Item 1", ...}, {name: "Item 2", ...}]
    const itemsRaw = (data.itemsList as string || "").split(',').map(i => i.trim()).filter(i => i);
    const items = itemsRaw.map(name => ({
      name,
      quantity: 1,
      unit: 'pcs',
      originalPrice: Number(data.originalPrice) / itemsRaw.length,
      discountedPrice: Number(data.price) / itemsRaw.length,
      expiryDate: new Date(data.expiryDate as string).toISOString()
    }));
    
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          items,
          dietaryTags,
          price: Number(data.price),
          originalPrice: Number(data.originalPrice),
          quantity: Number(data.quantity),
          expiryDate: new Date(data.expiryDate as string).toISOString(),
          urgency: 'medium'
        })
      });
      if (res.ok) {
        fetchVendorStats();
        fetchListings();
        (e.target as HTMLFormElement).reset();
        const imgInput = document.getElementById('listing-image-preview') as HTMLImageElement;
        const placeholder = document.getElementById('upload-placeholder') as HTMLDivElement;
        if (imgInput) imgInput.classList.add('hidden');
        if (placeholder) placeholder.classList.remove('hidden');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteListing = async (id: string) => {
    try {
      await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchVendorStats();
      fetchListings();
    } catch (err) {
      console.error(err);
    }
  };

  // Render Functions
  const renderNavbar = () => (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
          <div className="w-11 h-11 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-emerald-100 group-hover:scale-105 transition-transform">F</div>
          <span className="font-black text-2xl text-gray-900 tracking-tight">FoodSaver</span>
        </div>
        
        <div className="flex items-center gap-8">
          <button onClick={() => setView('marketplace')} className="text-gray-600 hover:text-emerald-600 font-bold transition-colors text-sm uppercase tracking-widest">Marketplace</button>
          {token ? (
            <div className="flex items-center gap-6">
              <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-bold transition-colors text-sm uppercase tracking-widest">
                <LayoutDashboard size={18} /> Dashboard
              </button>
              <div className="h-8 w-[1px] bg-gray-100" />
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-black text-gray-900">{user?.name}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user?.role}</div>
                </div>
                <button onClick={handleLogout} className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center transition-all">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button onClick={() => setView('login')} className="px-6 py-2.5 text-gray-600 font-bold hover:text-emerald-600 transition-colors text-sm uppercase tracking-widest">Login</button>
              <button onClick={() => setView('register')} className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-xl shadow-gray-200 text-sm uppercase tracking-widest">Register</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  const renderHero = () => (
    <div key="home" className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-emerald-50/30 -z-10" />
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold mb-6 border border-emerald-200">
            <ShieldCheck size={16} /> Certified Business Network
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] mb-8">
            The Smart Way to <span className="text-emerald-600">Reduce</span> Food Waste.
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed font-medium">
            Connecting premium food establishments with conscious consumers. Save costs, increase revenue, and protect the planet with our AI-driven marketplace.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => setView('marketplace')} className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center gap-2 text-lg">
              Explore Marketplace <ArrowRight size={20} />
            </button>
            {!user && (
              <button onClick={() => { setView('register'); setRole('vendor'); }} className="px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-all border border-gray-200 shadow-sm text-lg">
                Register as Business
              </button>
            )}
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8 border-t border-gray-100 pt-8">
            <div>
              <div className="text-3xl font-black text-gray-900">500+</div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Vendors</div>
            </div>
            <div>
              <div className="text-3xl font-black text-gray-900">12k+</div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Meals Saved</div>
            </div>
            <div>
              <div className="text-3xl font-black text-gray-900">$45k</div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Revenue Generated</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative hidden lg:block"
        >
          <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
            <img 
              src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=1200&q=80" 
              alt="Professional Kitchen" 
              className="w-full h-[600px] object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">AI-Driven Optimization</div>
                    <div className="text-white/70 text-sm">Predicting surplus before it happens.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-200 rounded-full blur-3xl -z-10" />
        </motion.div>
      </div>
    </div>
  );

  const renderMarketplace = () => (
    <div key="market" className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Live Marketplace</h2>
          <p className="text-lg text-gray-500 font-medium">Fresh surplus food available near you right now.</p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
          {['All', 'Bakery', 'Produce', 'Meals'].map(cat => (
            <button 
              key={cat}
              className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ 
                backgroundColor: cat === 'All' ? 'white' : 'transparent',
                color: cat === 'All' ? '#059669' : '#6B7280',
                boxShadow: cat === 'All' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {listings.map((item) => (
          <motion.div 
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500 overflow-hidden flex flex-col"
          >
            <div className="relative h-64 overflow-hidden">
              <img 
                src={item.image || `https://picsum.photos/seed/${item.title}/800/600`} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg flex items-center gap-2">
                  <Clock size={14} className="text-emerald-600" />
                  <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Exp. {new Date(item.expiryDate).toLocaleDateString()}
                  </span>
                </div>
                {item.urgency === 'high' && (
                  <div className="px-4 py-2 bg-red-500 text-white rounded-2xl shadow-lg flex items-center gap-2 animate-pulse">
                    <AlertTriangle size={14} />
                    <span className="text-xs font-black uppercase tracking-wider">Urgent</span>
                  </div>
                )}
              </div>
              <div className="absolute top-4 right-4 px-4 py-2 bg-emerald-600 text-white rounded-2xl shadow-lg font-black text-xs uppercase tracking-widest">
                {Math.round((1 - item.price / item.originalPrice) * 100)}% OFF
              </div>
            </div>

            <div className="p-8 flex-grow flex flex-col">
              <div className="flex items-center justify-between mb-4">
                {item.vendorId.businessType && (
                  <div className="flex items-center gap-2">
                    {item.vendorId.licenseNumber && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100" title="Verified License">
                        <div className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider">Verified</span>
                      </div>
                    )}
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full uppercase tracking-wider">
                      {item.vendorId.businessType}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                  <Store size={14} /> {item.vendorId.name}
                </div>
              </div>

              <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors leading-tight">{item.title}</h3>
              <p className="text-gray-500 text-sm mb-6 line-clamp-2 font-medium leading-relaxed">{item.description}</p>
              
              {item.items && item.items.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Included Items</p>
                  <div className="flex flex-wrap gap-2">
                    {item.items.map((subItem, idx) => (
                      <span key={idx} className="text-[11px] font-bold text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">
                        {subItem.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-8">
                {item.dietaryTags?.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 line-through font-bold mb-1">${item.originalPrice}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-emerald-600">${item.price}</span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Save {Math.round((1 - item.price / item.originalPrice) * 100)}%</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleBuyNow(item)}
                  className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all transform hover:-translate-y-1 shadow-xl shadow-gray-200 active:scale-95"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderCheckout = () => {
    return (
      <div key="checkout" className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-10 bg-gray-50">
              <h2 className="text-2xl font-bold mb-8">Order Summary</h2>
              <div className="flex gap-4 mb-8">
                <img src={selectedItem?.image} className="w-20 h-20 rounded-xl object-cover" referrerPolicy="no-referrer" />
                <div>
                  <h3 className="font-bold text-lg">{selectedItem?.title}</h3>
                  <p className="text-gray-500 text-sm">{selectedItem?.vendorId.name}</p>
                </div>
              </div>
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <div className="flex justify-between text-gray-600">
                  <span>Original Price</span>
                  <span className="line-through">${selectedItem?.originalPrice}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discounted Price</span>
                  <span>${selectedItem?.price}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-black text-xl pt-4 border-t border-gray-200">
                  <span>Total</span>
                  <span>${selectedItem?.price}</span>
                </div>
              </div>
            </div>
            
            <div className="p-10">
              <h2 className="text-2xl font-bold mb-8">Payment Method</h2>
              <div className="space-y-4">
                {[
                  { id: 'upi', label: 'UPI Payment', icon: <CreditCard className="text-blue-500" /> },
                  { id: 'scanner', label: 'Scan QR Code', icon: <QrCode className="text-purple-500" /> },
                  { id: 'bank', label: 'Bank Account', icon: <Building2 className="text-emerald-500" /> }
                ].map(method => (
                  <button 
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={cn(
                      "w-full p-4 border-2 rounded-2xl flex items-center gap-4 transition-all group",
                      selectedMethod === method.id ? "border-emerald-600 bg-emerald-50" : "border-gray-100 hover:border-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      {method.icon}
                    </div>
                    <span className="font-bold text-gray-700">{method.label}</span>
                    {selectedMethod === method.id && <div className="ml-auto w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white"><ChevronRight size={14} /></div>}
                  </button>
                ))}
              </div>
              
              <AnimatePresence>
                {selectedMethod === 'scanner' && selectedItem?.vendorId.paymentScanner && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center overflow-hidden"
                  >
                    <p className="text-sm font-bold text-emerald-700 mb-4">Vendor's Payment QR</p>
                    <img src={selectedItem.vendorId.paymentScanner} className="mx-auto w-32 h-32 rounded-lg shadow-md" />
                    <p className="text-[10px] text-emerald-600 mt-2">Scan this code to pay directly to the vendor</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                disabled={!selectedMethod}
                onClick={() => handlePayment(selectedMethod!)}
                className="w-full mt-8 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl"
              >
                Complete Purchase
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div key="dashboard" className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
      {user?.role === 'vendor' ? (
        <div className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Vendor Console</h2>
              <p className="text-lg text-gray-500 font-medium">Manage your surplus and track your impact.</p>
            </div>
            <div className="flex items-center gap-4 px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-xs font-black text-emerald-800 uppercase tracking-widest">Verified Business</div>
                <div className="text-sm font-bold text-emerald-600">{user?.businessName}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <DollarSign size={28} />
              </div>
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-1">Total Profit</p>
              <h3 className="text-4xl font-black text-gray-900">${vendorStats.profit}</h3>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShoppingBag size={28} />
              </div>
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-1">Orders Fulfilled</p>
              <h3 className="text-4xl font-black text-gray-900">{vendorStats.ordersCount}</h3>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Package size={28} />
              </div>
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-1">Active Listings</p>
              <h3 className="text-4xl font-black text-gray-900">{vendorStats.listings.length}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm h-fit sticky top-28">
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-gray-900">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <PlusCircle size={20} />
                </div>
                Create Bundle
              </h3>
              <form onSubmit={handleAddListing} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Bundle Title</label>
                    <input name="title" placeholder="e.g. Morning Pastry Box" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold placeholder:text-gray-300" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Description</label>
                    <textarea name="description" placeholder="What's inside this bundle?" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 h-28 font-medium placeholder:text-gray-300" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Included Items</label>
                  <input name="itemsList" placeholder="Croissant, Muffin, Bagel..." className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold placeholder:text-gray-300" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Sale Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                      <input name="price" type="number" placeholder="0.00" className="w-full p-4 pl-8 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-black" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Original</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                      <input name="originalPrice" type="number" placeholder="0.00" className="w-full p-4 pl-8 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-black" required />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Stock</label>
                    <input name="quantity" type="number" placeholder="10" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-black" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Expiry</label>
                    <div className="relative">
                      <input name="expiryDate" type="date" id="expiryDateInput" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold" required />
                      <button 
                        type="button"
                        onClick={async () => {
                          const title = (document.getElementsByName('title')[0] as HTMLInputElement).value;
                          const category = (document.getElementsByName('category')[0] as HTMLInputElement).value;
                          if (!title) return alert('Enter a title first');
                          const res = await fetch('/api/ai/predict-expiry', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ title, category })
                          });
                          const data = await res.json();
                          const date = new Date();
                          date.setDate(date.getDate() + data.days);
                          (document.getElementById('expiryDateInput') as HTMLInputElement).value = date.toISOString().split('T')[0];
                        }}
                        className="absolute right-2 top-2 p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors shadow-sm"
                        title="AI Predict Expiry"
                      >
                        <Clock size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Category & Dietary</label>
                  <select name="category" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold appearance-none">
                    <option>Bakery</option>
                    <option>Produce</option>
                    <option>Meals</option>
                    <option>Dairy</option>
                    <option>Beverages</option>
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'isVegan', label: 'Vegan' },
                      { id: 'isVegetarian', label: 'Veg' },
                      { id: 'isOrganic', label: 'Organic' },
                      { id: 'isGlutenFree', label: 'GF' }
                    ].map(tag => (
                      <div key={tag.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-colors cursor-pointer group">
                        <input type="checkbox" id={tag.id} name={tag.id} className="w-5 h-5 text-emerald-600 rounded-lg border-gray-300 focus:ring-emerald-500 cursor-pointer" />
                        <label htmlFor={tag.id} className="text-xs font-black text-gray-500 group-hover:text-emerald-600 cursor-pointer uppercase tracking-wider">{tag.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const imgInput = document.getElementById('listing-image-preview') as HTMLImageElement;
                          const hiddenInput = document.getElementById('listing-image-hidden') as HTMLInputElement;
                          const placeholder = document.getElementById('upload-placeholder') as HTMLDivElement;
                          if (imgInput) {
                            imgInput.src = reader.result as string;
                            imgInput.classList.remove('hidden');
                          }
                          if (placeholder) placeholder.classList.add('hidden');
                          if (hiddenInput) hiddenInput.value = reader.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden" 
                    id="listing-image-upload"
                  />
                  <label 
                    htmlFor="listing-image-upload"
                    className="w-full p-8 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                    <img id="listing-image-preview" className="w-full h-40 object-cover rounded-2xl hidden mb-2 shadow-lg" />
                    <div id="upload-placeholder" className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <PlusCircle size={24} className="text-emerald-600" />
                      </div>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Upload Image</span>
                    </div>
                  </label>
                  <input type="hidden" name="image" id="listing-image-hidden" />
                </div>
                <button type="submit" className="w-full py-5 bg-gray-900 text-white font-black rounded-[2rem] hover:bg-emerald-600 transition-all shadow-xl shadow-gray-200 text-sm uppercase tracking-[0.2em] active:scale-95">Create Listing</button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-black mb-8 text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Package size={20} />
                  </div>
                  Your Active Listings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vendorStats.listings.map((item: any) => (
                    <div key={item._id} className="flex flex-col p-6 bg-gray-50 rounded-[2.5rem] group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-5 mb-6">
                        <img src={item.image || `https://picsum.photos/seed/${item.title}/200/200`} className="w-20 h-20 rounded-2xl object-cover shadow-md" referrerPolicy="no-referrer" />
                        <div className="flex-grow">
                          <h4 className="font-black text-gray-900 text-lg leading-tight mb-1">{item.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-emerald-600">${item.price}</span>
                            <span className="text-xs font-bold text-gray-400">• {item.quantity} in stock</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteListing(item._id)}
                          className="w-12 h-12 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl flex items-center justify-center transition-all shadow-sm"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exp. {new Date(item.expiryDate).toLocaleDateString()}</span>
                        </div>
                        <div className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 shadow-sm">
                          {item.category}
                        </div>
                      </div>
                    </div>
                  ))}
                  {vendorStats.listings.length === 0 && (
                    <div className="col-span-2 py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                      <Package size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-400 font-bold">No active listings yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-black mb-8 text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                    <ShoppingBag size={20} />
                  </div>
                  Recent Orders
                </h3>
                <div className="space-y-4">
                  {vendorStats.ordersCount > 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-[2rem] border border-gray-100">
                      <p className="text-gray-400 font-bold">Order tracking enabled. {vendorStats.ordersCount} orders processed.</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-[2rem] border border-gray-100">
                      <p className="text-gray-400 font-bold">No orders yet. Your listings are live!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-12 rounded-[3rem] text-white relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-emerald-100 font-medium mb-2">Impact Dashboard</p>
              <h2 className="text-4xl font-black mb-8">Total Savings: ${consumerStats.savedAmount}</h2>
              <div className="flex gap-8">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                  <TrendingDown className="mb-2" />
                  <p className="text-sm text-emerald-100">Waste Reduced</p>
                  <p className="text-2xl font-bold">12.4 kg</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                  <AlertTriangle className="mb-2" />
                  <p className="text-sm text-emerald-100">Items Rescued</p>
                  <p className="text-2xl font-bold">8 Items</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
              <p className="text-gray-500 italic">No recent orders yet. Start saving food today!</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6">AI Recommendations</h3>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-emerald-800 text-sm leading-relaxed">
                  Based on your preferences, local bakeries often have surplus items around 6:00 PM. Check back then for up to 70% discounts!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAuthPage = () => (
    <div key="auth" className="pt-32 pb-20 px-4 flex items-center justify-center bg-gray-50/50 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 shadow-lg shadow-emerald-200">F</div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            {view === 'login' ? 'Welcome Back' : 'Join the Movement'}
          </h2>
          <p className="text-gray-500 font-medium">
            {view === 'login' ? 'Sign in to access your personalized dashboard' : 'Start your journey towards zero food waste today'}
          </p>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium mb-8 border border-red-100 flex items-center gap-2">
          <AlertTriangle size={18} /> {error}
        </div>}

        <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-6">
          {view === 'register' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Account Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    onClick={() => setRole('consumer')} 
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all text-left group",
                      role === 'consumer' ? "border-emerald-600 bg-emerald-50" : "border-gray-100 hover:border-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors", role === 'consumer' ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-emerald-600 group-hover:text-white")}>
                      <UserIcon size={20} />
                    </div>
                    <div className="font-bold text-gray-900">Consumer</div>
                    <div className="text-[10px] text-gray-500">Buy surplus food at discounts</div>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setRole('vendor')} 
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all text-left group",
                      role === 'vendor' ? "border-emerald-600 bg-emerald-50" : "border-gray-100 hover:border-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors", role === 'vendor' ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-emerald-600 group-hover:text-white")}>
                      <Building2 size={20} />
                    </div>
                    <div className="font-bold text-gray-900">Vendor</div>
                    <div className="text-[10px] text-gray-500">List surplus food for sale</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. john@example.com" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="e.g. +91 98765 43210" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" required />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Address Information</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <input value={street} onChange={e => setStreet(e.target.value)} placeholder="Street Address" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" required />
                  </div>
                  <input value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="ZIP Code" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" required />
                  <div className="md:col-span-2">
                    <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" required />
                  </div>
                </div>
              </div>

              {role === 'vendor' && (
                <div className="space-y-6 pt-4 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Business Information</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Business Name</label>
                      <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Fresh Market" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Business Type</label>
                      <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all appearance-none">
                        <option>Restaurant</option>
                        <option>Cafe</option>
                        <option>Bakery</option>
                        <option>Grocery Store</option>
                        <option>Hotel</option>
                        <option>Catering</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Business License Number</label>
                      <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="e.g. FSSAI-123456789" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Payment Scanner (QR Code)</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setScanner(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden" 
                        id="scanner-upload"
                      />
                      <label 
                        htmlFor="scanner-upload"
                        className="w-full p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                      >
                        {scanner ? (
                          <img src={scanner} className="w-32 h-32 object-contain rounded-lg" />
                        ) : (
                          <>
                            <QrCode size={32} className="text-gray-400" />
                            <span className="text-sm text-gray-500">Upload QR Code / Bar Code</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'login' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. john@example.com" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" required />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50 text-lg"
          >
            {loading ? 'Processing...' : view === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-gray-500 font-medium">
            {view === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setView(view === 'login' ? 'register' : 'login')}
              className="text-emerald-600 font-bold hover:underline"
            >
              {view === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {renderNavbar()}
      
      <main>
        <AnimatePresence mode="wait">
          {view === 'home' && renderHero()}
          {view === 'marketplace' && renderMarketplace()}
          {view === 'checkout' && renderCheckout()}
          {view === 'dashboard' && renderDashboard()}
          {(view === 'login' || view === 'register') && renderAuthPage()}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">F</div>
            <span className="font-bold text-gray-900">FoodSaver</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-emerald-600 transition-colors">HACCP Compliance</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">ISO 22000</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a>
          </div>
          <p className="text-sm text-gray-400">© 2026 FoodSaver Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
