'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, MapPin, Minus, Package2, Plus, Search, ShieldCheck, ShoppingCart, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const readSavedCart = () => {
  try {
    const saved = window.localStorage.getItem('pharmapulse-cart');
    const parsed = saved ? JSON.parse(saved) : null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return {
      branchId: typeof parsed.branchId === 'string' ? parsed.branchId : '',
      idempotencyKey: typeof parsed.idempotencyKey === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed.idempotencyKey)
        ? parsed.idempotencyKey
        : '',
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    console.error('Unable to read saved pharmacy cart.');
    return null;
  }
};

const saveCart = (value) => {
  try {
    window.localStorage.setItem('pharmapulse-cart', JSON.stringify(value));
  } catch (error) {
    console.error('Unable to save pharmacy cart:', error);
  }
};

const clearSavedCart = () => {
  try {
    window.localStorage.removeItem('pharmapulse-cart');
  } catch (error) {
    console.error('Unable to clear saved pharmacy cart:', error);
  }
};

export default function CustomerShopPage() {
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [initialRetryToken, setInitialRetryToken] = useState(0);
  const [catalogError, setCatalogError] = useState('');
  const [cart, setCart] = useState([]);
  const [cartReady, setCartReady] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [accountState, setAccountState] = useState('loading');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadInitialCatalog = async () => {
      setLoading(true);
      setCatalogError('');
      try {
        const requestedBranchId = new URLSearchParams(window.location.search).get('branchId');
        const query = requestedBranchId ? `?branchId=${encodeURIComponent(requestedBranchId)}` : '';
        const response = await fetch(`/api/customer/medicines${query}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load the medicine store.');

        const branches = data.branches || [];
        const defaultBranch = data.branch || branches[0];
        if (!defaultBranch) {
          if (!cancelled) {
            setPharmacies([]);
            setMedicines([]);
            clearSavedCart();
            setLoading(false);
            setCartReady(true);
          }
          return;
        }

        const savedCart = readSavedCart();
        const savedBranch = branches.find((branch) => branch.id === savedCart?.branchId);
        const savedCartMatches = requestedBranchId
          ? savedCart?.branchId === defaultBranch.id
          : Boolean(savedBranch);
        const selectedBranch = !requestedBranchId && savedBranch ? savedBranch : defaultBranch;
        const savedItems = savedCartMatches
          ? savedCart.items.filter((item) =>
              item &&
              typeof item.medicineId === 'string' &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0
            ).map((item) => ({ ...item, quantity: Math.min(item.quantity, 999) }))
          : [];

        if (cancelled) return;
        setPharmacies(branches);
        setSelectedBranchId(selectedBranch.id);
        setCart(savedItems);
        setIdempotencyKey(savedCartMatches ? savedCart.idempotencyKey : '');
        setCartReady(true);
        setCategories(data.categories || []);
        setCurrency(data.currency || 'USD');
        setPharmacyName(data.branch?.organizationName || '');

        if (selectedBranch.id === data.branch?.id) {
          setMedicines(data.medicines || []);
          setTotalMedicines(data.pagination?.total || 0);
          setHasMore(Boolean(data.pagination?.hasMore));
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError(error.message || 'Unable to load the medicine store.');
          setLoading(false);
          setCartReady(true);
        }
      }
    };

    loadInitialCatalog();
    return () => {
      cancelled = true;
    };
  }, [initialRetryToken]);

  useEffect(() => {
    if (!selectedBranchId) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setCatalogError('');
      try {
        const params = new URLSearchParams({ branchId: selectedBranchId, page: String(page) });
        if (search.trim()) params.set('search', search.trim());
        if (categoryId) params.set('categoryId', categoryId);
        const response = await fetch(`/api/customer/medicines?${params.toString()}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load medicines for this branch.');
        setMedicines(data.medicines || []);
        setCategories(data.categories || []);
        setCurrency(data.currency || 'USD');
        setPharmacyName(data.branch?.organizationName || '');
        setTotalMedicines(data.pagination?.total || 0);
        setHasMore(Boolean(data.pagination?.hasMore));
      } catch (error) {
        if (error.name !== 'AbortError') {
          setCatalogError(error.message || 'Unable to load medicines for this branch.');
          setMedicines([]);
          setTotalMedicines(0);
          setHasMore(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [selectedBranchId, search, categoryId, page, refreshToken]);

  useEffect(() => {
    if (!cartReady || !selectedBranchId) return;
    saveCart({ branchId: selectedBranchId, items: cart, idempotencyKey });
  }, [cart, cartReady, idempotencyKey, selectedBranchId]);

  useEffect(() => {
    let cancelled = false;
    const loadCustomerAccount = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          if (!cancelled) setAccountState('signed-out');
          return;
        }
        const data = await response.json();
        if (cancelled) return;
        if (data.role === 'CUSTOMER') {
          setCustomerDetails((current) => ({ ...current, name: data.user.name, email: data.user.email }));
          setAccountState('customer');
        } else {
          setAccountState('not-customer');
        }
      } catch {
        if (!cancelled) setAccountState('unavailable');
      }
    };

    loadCustomerAccount();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeBranch = useMemo(
    () => pharmacies.find((branch) => branch.id === selectedBranchId) || null,
    [pharmacies, selectedBranchId]
  );
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  const selectBranch = (branchId) => {
    if (branchId === selectedBranchId) return;
    setSelectedBranchId(branchId);
    setPage(1);
    setCart([]);
    setIdempotencyKey('');
    setCheckoutError('');
    setMedicines([]);
  };

  const addToCart = (item) => {
    if (!item.inStock || item.availableStock < 1) {
      toast.error('This medicine is temporarily unavailable.');
      return;
    }
    const maxQuantity = Math.min(item.availableStock, 999);
    const existing = cart.find((entry) => entry.medicineId === item.id);
    if (existing && existing.quantity >= maxQuantity) {
      toast.error('You have added all currently available units.');
      return;
    }

    setCart((current) => {
      const currentItem = current.find((entry) => entry.medicineId === item.id);
      if (currentItem) {
        return current.map((entry) =>
          entry.medicineId === item.id
            ? { ...entry, name: item.name, genericName: item.genericName, brand: item.brand, price: Number(item.price), availableStock: item.availableStock, quantity: Math.min(entry.quantity + 1, maxQuantity) }
            : entry
        );
      }
      return [
        ...current,
        {
          medicineId: item.id,
          name: item.name,
          genericName: item.genericName,
          brand: item.brand,
          price: Number(item.price),
          availableStock: item.availableStock,
          quantity: 1,
        },
      ];
    });
    setIdempotencyKey('');
    setCheckoutError('');
  };

  const updateQuantity = (medicineId, delta) => {
    const item = cart.find((entry) => entry.medicineId === medicineId);
    if (!item) return;
    if (delta > 0 && item.quantity >= Math.min(item.availableStock, 999)) {
      toast.error('You have added all currently available units.');
      return;
    }
    setCart((current) =>
      current
        .map((entry) =>
          entry.medicineId === medicineId
            ? { ...entry, quantity: Math.min(Math.min(entry.availableStock, 999), Math.max(1, entry.quantity + delta)) }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
    setIdempotencyKey('');
    setCheckoutError('');
  };

  const removeFromCart = (medicineId) => {
    setCart((current) => current.filter((entry) => entry.medicineId !== medicineId));
    setIdempotencyKey('');
    setCheckoutError('');
  };

  const updateCustomerDetail = (field, value) => {
    setCustomerDetails((current) => ({ ...current, [field]: value }));
    setIdempotencyKey('');
  };

  const placeOrder = async () => {
    if (accountState !== 'customer') {
      toast.error('Please sign in with a customer account to place an order.');
      return;
    }
    if (!selectedBranchId) {
      toast.error('Please select a pharmacy first.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    setSubmitting(true);
    setCheckoutError('');
    try {
      const requestKey = idempotencyKey || window.crypto.randomUUID();
      setIdempotencyKey(requestKey);
      saveCart({ branchId: selectedBranchId, items: cart, idempotencyKey: requestKey });
      const response = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          idempotencyKey: requestKey,
          customerPhone: customerDetails.phone,
          deliveryAddress: customerDetails.address,
          notes: customerDetails.notes,
          paymentMethod: 'CASH_ON_DELIVERY',
          items: cart.map((item) => ({ medicineId: item.medicineId, quantity: item.quantity })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to place your order.');

      setCart([]);
      setIdempotencyKey('');
      clearSavedCart();
      router.push(`/customer/orders/${data.order.id}`);
    } catch (error) {
      const message = error.message || 'Unable to place your order. Please try again.';
      setCheckoutError(message);
      toast.error(message);
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
            <p className="text-sm text-slate-500 mt-1">Browse in-stock medicines and place a secure online order.</p>
          </div>
          <div className="w-full max-w-md">
            <label htmlFor="shop-branch" className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Select pharmacy branch</label>
            <select
              id="shop-branch"
              value={selectedBranchId}
              onChange={(event) => selectBranch(event.target.value)}
              disabled={pharmacies.length === 0}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {pharmacies.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name} · {branch.city || branch.address || 'Main Branch'}</option>
              ))}
            </select>
            {pharmacyName && <p className="mt-1 text-xs text-slate-500">{pharmacyName}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_0.9fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Search by medicine or generic name"
                aria-label="Search medicines"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <select
              value={categoryId}
              onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}
              aria-label="Filter by category"
              className="w-full sm:w-52 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>

          {catalogError ? (
            <div role="alert" className="bg-white rounded-2xl border border-rose-200 p-6 text-center text-sm text-rose-700">
              <AlertCircle className="w-5 h-5 mx-auto mb-2" />{catalogError}
              <button
                onClick={() => {
                  if (selectedBranchId) setRefreshToken((current) => current + 1);
                  else setInitialRetryToken((current) => current + 1);
                }}
                className="block mx-auto mt-3 font-bold underline"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center min-h-[260px] bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" aria-label="Loading medicines" />
            </div>
          ) : (
            <>
              <div className="text-xs text-slate-500">{totalMedicines} medicine(s) found</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicines.length === 0 ? (
                  <div className="md:col-span-2 bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    No medicines match your search at this branch.
                  </div>
                ) : medicines.map((item) => (
                  <article key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 space-y-3">
                      {item.imageUrl && (
                        <div className="h-36 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden">
                          <Image src={item.imageUrl} alt={item.name} width={240} height={144} className="h-full w-full object-contain" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-xl font-bold text-slate-900">{item.name}</h2>
                          <p className="text-xs text-slate-500">{item.genericName || item.brand || 'Pharmacy medicine'}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold ${item.inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {item.inStock ? 'Available' : 'Out of stock'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600">
                        {item.category?.name && <div>Category: {item.category.name}</div>}
                        {item.manufacturer && <div>Manufacturer: {item.manufacturer}</div>}
                        {item.dosageForm && <div>Form: {item.dosageForm}</div>}
                        {item.strength && <div>Strength: {item.strength}</div>}
                        <div>Stock at this branch: {item.availableStock} units</div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div>
                          <div className="text-xl font-extrabold text-emerald-700">{formatCurrency(item.price, currency)}</div>
                          <div className="text-[10px] text-slate-500">per unit</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/shop/${item.id}?branchId=${encodeURIComponent(selectedBranchId)}`} className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50">
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
                  </article>
                ))}
              </div>
              {(page > 1 || hasMore) && (
                <div className="flex items-center justify-between">
                  <button disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40">Previous</button>
                  <span className="text-xs text-slate-500">Page {page}</span>
                  <button disabled={!hasMore || loading} onClick={() => setPage((current) => current + 1)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40">Next</button>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-fit xl:sticky xl:top-28">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Your cart</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">{cart.length} medicine(s)</span>
          </div>

          {cart.length === 0 ? (
            <div className="text-sm text-slate-500 py-6 text-center">Your cart is empty. Add medicines to place an order.</div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.medicineId} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                      <p className="text-[11px] text-slate-500">{item.genericName || item.brand || 'Medicine'}</p>
                      <p className="text-[11px] text-slate-500">{formatCurrency(item.price, currency)} per unit</p>
                    </div>
                    <button onClick={() => removeFromCart(item.medicineId)} aria-label={`Remove ${item.name}`} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.medicineId, -1)} aria-label={`Decrease ${item.name}`} className="w-7 h-7 rounded-lg border border-slate-300 text-slate-700 flex items-center justify-center">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.medicineId, 1)} disabled={item.quantity >= Math.min(item.availableStock, 999)} aria-label={`Increase ${item.name}`} className="w-7 h-7 rounded-lg border border-slate-300 text-slate-700 flex items-center justify-center disabled:opacity-40">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="font-bold text-emerald-700 text-sm">{formatCurrency(item.price * item.quantity, currency)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-200 mt-5 pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Subtotal (estimate)</span>
              <span className="font-bold text-slate-800">{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Delivery</span><span className="font-bold text-slate-800">Free</span>
            </div>
            <div className="flex items-center justify-between text-base font-extrabold text-slate-900">
              <span>Total (estimate)</span>
              <span className="text-emerald-700">{formatCurrency(subtotal, currency)}</span>
            </div>
            <p className="text-[11px] text-slate-500">Final prices and stock are verified securely when your order is placed.</p>
          </div>

          <div className="mt-5 space-y-3">
            {accountState === 'customer' ? (
              <>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm">
                  <div className="font-bold text-slate-800">{customerDetails.name}</div>
                  <div className="text-xs text-slate-600">{customerDetails.email}</div>
                </div>
                <div>
                  <label htmlFor="customer-phone" className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Phone (optional)</label>
                  <input id="customer-phone" type="tel" value={customerDetails.phone} onChange={(event) => updateCustomerDetail('phone', event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="+1 555 000 0000" />
                </div>
                <div>
                  <label htmlFor="delivery-address" className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Delivery address (optional)</label>
                  <textarea id="delivery-address" value={customerDetails.address} onChange={(event) => updateCustomerDetail('address', event.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Street, area, city (leave blank for pickup)" />
                </div>
                <div>
                  <label htmlFor="order-notes" className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Notes (optional)</label>
                  <textarea id="order-notes" value={customerDetails.notes} onChange={(event) => updateCustomerDetail('notes', event.target.value)} rows={2} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Special instructions" />
                </div>
                <button
                  type="button"
                  disabled={submitting || cart.length === 0}
                  onClick={placeOrder}
                  className="w-full mt-3 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Placing order...' : 'Place order · Cash on delivery'}
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {accountState === 'loading' ? 'Checking customer account...' : accountState === 'unavailable' ? 'Unable to verify your account right now.' : 'Sign in or create a customer account to place an order.'}
                </p>
                {accountState !== 'loading' && (
                  <div className="mt-3 flex flex-col gap-2">
                    <Link href="/login" className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm">Sign in</Link>
                    <Link href="/customer/register" className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm">Create account</Link>
                  </div>
                )}
              </div>
            )}
            {checkoutError && <p role="alert" className="text-sm text-rose-600">{checkoutError}</p>}
            <Link href="/customer" className="block w-full text-center py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              View order history
            </Link>
          </div>

          {activeBranch && (
            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
              <div className="font-bold text-slate-800 mb-1">{activeBranch.name}</div>
              <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {activeBranch.address || activeBranch.city || 'Selected pharmacy branch'}</div>
            </div>
          )}
          {!activeBranch && !loading && !catalogError && (
            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4 text-center text-sm text-slate-500">
              <Package2 className="w-5 h-5 mx-auto mb-2" /> No pharmacy branch is currently available.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
