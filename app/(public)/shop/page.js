'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, MapPin, Minus, Plus, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function CustomerShopPage() {
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = window.localStorage.getItem('pharmapulse-cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.localStorage.setItem('pharmapulse-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/customer/medicines');
        const data = await res.json();
        const branchOptions = data.branches || [];
        setPharmacies(branchOptions);
        const firstBranch = data.branch || branchOptions[0];
        if (firstBranch) {
          setSelectedBranchId(firstBranch.id);
          setMedicines(data.medicines || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, []);

  useEffect(() => {
    const loadCustomerAccount = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) return;
        const data = await response.json();
        if (data.role === 'CUSTOMER') {
          setCustomerDetails((current) => ({
            ...current,
            name: data.user.name,
            email: data.user.email,
          }));
        }
      } catch (error) {
        console.error('Unable to load customer account details:', error);
      }
    };

    loadCustomerAccount();
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;

    const fetchMedicines = async () => {
      setLoading(true);
      try {
        const query = search ? `&search=${encodeURIComponent(search)}` : '';
        const res = await fetch(`/api/customer/medicines?branchId=${selectedBranchId}${query}`);
        const data = await res.json();
        setMedicines(data.medicines || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchMedicines, 250);
    return () => clearTimeout(timer);
  }, [selectedBranchId, search]);

  const activeBranch = useMemo(
    () => pharmacies.find((branch) => branch.id === selectedBranchId) || null,
    [pharmacies, selectedBranchId]
  );

  const addToCart = (item) => {
    const preferredBatch = item.batches?.[0];
    if (!preferredBatch) {
      toast.error('This medicine is temporarily unavailable.');
      return;
    }

    setCart((current) => {
      const existing = current.find((entry) => entry.medicineId === item.id);
      if (existing) {
        return current.map((entry) =>
          entry.medicineId === item.id
            ? { ...entry, quantity: Math.min(entry.quantity + 1, item.availableStock), batchId: preferredBatch.id }
            : entry
        );
      }

      return [
        ...current,
        {
          medicineId: item.id,
          batchId: preferredBatch.id,
          name: item.name,
          genericName: item.genericName,
          brand: item.brand,
          price: Number(item.price),
          availableStock: item.availableStock,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (medicineId, delta) => {
    setCart((current) =>
      current
        .map((entry) => {
          if (entry.medicineId !== medicineId) return entry;
          const nextQuantity = Math.max(1, entry.quantity + delta);
          return { ...entry, quantity: nextQuantity };
        })
        .filter((entry) => entry.quantity > 0)
    );
  };

  const removeFromCart = (medicineId) => {
    setCart((current) => current.filter((entry) => entry.medicineId !== medicineId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const placeOrder = async () => {
    if (!selectedBranchId) {
      toast.error('Please select a pharmacy first');
      return;
    }

    if (!customerDetails.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setSubmitting(true);
    try {
      const items = cart.map((item) => ({
        medicineId: item.medicineId,
        batchId: item.batchId,
        quantity: item.quantity,
      }));

      const res = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          customerName: customerDetails.name,
          customerPhone: customerDetails.phone,
          customerEmail: customerDetails.email,
          deliveryAddress: customerDetails.address,
          notes: customerDetails.notes,
          paymentMethod: 'CASH_ON_DELIVERY',
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Order failed');
      }

      setCart([]);
      toast.success('Order placed successfully. Our pharmacy team will confirm it shortly.');
      router.push('/customer');
    } catch (error) {
      toast.error(error.message || 'Unable to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> Trusted pharmacy ordering
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Medicine Store</h1>
            <p className="text-sm text-slate-500 mt-1">Browse available medicines, search by name, and place a safe online order.</p>
          </div>
          <div className="w-full max-w-md">
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Select pharmacy</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {pharmacies.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} · {branch.city || branch.address || 'Main Branch'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_0.9fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicines by name or generic name"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[260px] bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicines.length === 0 ? (
                <div className="md:col-span-2 bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  No medicines are available for this pharmacy right now.
                </div>
              ) : (
                medicines.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">{item.name}</h2>
                          <p className="text-xs text-slate-500">{item.genericName || item.brand || 'Pharmacy medicine'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${item.inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {item.inStock ? 'Available' : 'Out of stock'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600">
                        {item.category?.name && <div>Category: {item.category.name}</div>}
                        {item.dosageForm && <div>Form: {item.dosageForm}</div>}
                        {item.strength && <div>Strength: {item.strength}</div>}
                        <div>Stock: {item.availableStock} units</div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div>
                          <div className="text-xl font-extrabold text-emerald-700">{formatCurrency(item.price, 'USD')}</div>
                          <div className="text-[10px] text-slate-500">per unit</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/shop/${item.id}`} className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            Details
                          </Link>
                          <button
                            onClick={() => addToCart(item)}
                            disabled={!item.inStock}
                            className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add to cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-fit sticky top-28">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Your cart</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">{cart.length} item(s)</span>
          </div>

          {cart.length === 0 ? (
            <div className="text-sm text-slate-500 py-6 text-center">Your cart is empty. Add medicines to place an order.</div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.medicineId} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                      <p className="text-[11px] text-slate-500">{item.genericName || item.brand || 'Medicine'}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.medicineId)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.medicineId, -1)} className="w-7 h-7 rounded-lg border border-slate-300 text-slate-700 flex items-center justify-center">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.medicineId, 1)} className="w-7 h-7 rounded-lg border border-slate-300 text-slate-700 flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="font-bold text-emerald-700 text-sm">{formatCurrency(item.price * item.quantity, 'USD')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-200 mt-5 pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800">{formatCurrency(subtotal, 'USD')}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Delivery</span>
              <span className="font-bold text-slate-800">Free</span>
            </div>
            <div className="flex items-center justify-between text-base font-extrabold text-slate-900">
              <span>Total</span>
              <span className="text-emerald-700">{formatCurrency(subtotal, 'USD')}</span>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Name</label>
              <input value={customerDetails.name} onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Phone</label>
              <input value={customerDetails.phone} onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="+1 555 000 0000" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Email</label>
              <input type="email" value={customerDetails.email} onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Delivery address</label>
              <textarea value={customerDetails.address} onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Street, area, city" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Notes</label>
              <textarea value={customerDetails.notes} onChange={(e) => setCustomerDetails({ ...customerDetails, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Special instructions" />
            </div>
            <button
              type="button"
              disabled={submitting || cart.length === 0}
              onClick={placeOrder}
              className="w-full mt-3 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Placing order...' : 'Place order'}
            </button>
            <Link href="/customer" className="block w-full text-center py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              View order history
            </Link>
          </div>

          {activeBranch && (
            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
              <div className="font-bold text-slate-800 mb-1">{activeBranch.name}</div>
              <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {activeBranch.address || activeBranch.city || 'Located in your selected pharmacy'}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
