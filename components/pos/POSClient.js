'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Barcode,
  Printer,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Building,
  User,
  X,
  Loader2,
  Pill,
} from 'lucide-react';
import { formatCurrency, calculateExpiryStatus, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function POSClient({ initialMedicines = [], initialCustomers = [], organization, branch }) {
  const searchInputRef = useRef(null);

  const [medicines, setMedicines] = useState(initialMedicines);
  const [customers, setCustomers] = useState(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(organization?.taxRate || 0);

  const [submitting, setSubmitting] = useState(false);
  const [invoiceModalData, setInvoiceModalData] = useState(null);
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'cart'

  // Auto focus search input on load
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Filter medicines by search query or barcode
  const filteredMedicines = medicines.filter((m) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    return (
      m.name.toLowerCase().includes(query) ||
      (m.genericName && m.genericName.toLowerCase().includes(query)) ||
      (m.brand && m.brand.toLowerCase().includes(query)) ||
      (m.barcode && m.barcode.toLowerCase().includes(query)) ||
      (m.sku && m.sku.toLowerCase().includes(query))
    );
  });

  // Handle barcode exact hit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const exactMatch = medicines.find(
        (m) => m.barcode === searchTerm.trim() || m.sku === searchTerm.trim()
      );
      if (exactMatch && exactMatch.batches.length > 0) {
        addToCart(exactMatch, exactMatch.batches[0]);
        setSearchTerm('');
        toast.success(`Added ${exactMatch.name} to cart via barcode`);
      }
    }
  };

  const addToCart = (medicine, selectedBatch) => {
    if (!selectedBatch || selectedBatch.quantity <= 0) {
      toast.error('No stock available for this batch');
      return;
    }

    // Check if batch already in cart
    const existingIndex = cart.findIndex((item) => item.batchId === selectedBatch.id);

    if (existingIndex >= 0) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > selectedBatch.quantity) {
        toast.error(`Cannot exceed available batch stock (${selectedBatch.quantity})`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          medicineId: medicine.id,
          medicineName: medicine.name,
          dosageForm: medicine.dosageForm,
          strength: medicine.strength,
          batchId: selectedBatch.id,
          batchNumber: selectedBatch.batchNumber,
          expiryDate: selectedBatch.expiryDate,
          maxStock: selectedBatch.quantity,
          unitPrice: selectedBatch.sellingPrice,
          quantity: 1,
          discount: 0,
        },
      ]);
    }
  };

  const updateQuantity = (batchId, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.batchId === batchId) {
            const newQty = item.quantity + delta;
            if (newQty > item.maxStock) {
              toast.error(`Max stock available is ${item.maxStock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (batchId) => {
    setCart(cart.filter((item) => item.batchId !== batchId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity - item.discount), 0);
  const calculatedTax = (subtotal - discount) * (taxRate / 100);
  const grandTotal = Math.max(0, subtotal - discount + (calculatedTax > 0 ? calculatedTax : 0));

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomer || null,
        paymentMethod,
        discount: parseFloat(discount) || 0,
        tax: parseFloat(calculatedTax.toFixed(2)) || 0,
        items: cart.map((item) => ({
          medicineId: item.medicineId,
          batchId: item.batchId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
      };

      const res = await fetch('/api/pos/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Sale transaction failed');
        setSubmitting(false);
        return;
      }

      toast.success(`Sale completed! Invoice #${data.invoice.invoiceNumber}`);
      setInvoiceModalData(data);
      setCart([]);
      setDiscount(0);
      setSearchTerm('');
      setSubmitting(false);
    } catch (e) {
      toast.error('Failed to complete transaction');
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-3">
      {/* Mobile Mode Switcher (Medicines Catalog vs Order Checkout) */}
      <div className="lg:hidden grid grid-cols-2 p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
        <button
          onClick={() => setMobileTab('catalog')}
          className={cn(
            'py-2 px-3 rounded-lg text-center transition-all truncate',
            mobileTab === 'catalog'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          Medicines ({filteredMedicines.length})
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={cn(
            'py-2 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 truncate',
            mobileTab === 'cart'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <span>Cart ({cart.length})</span>
          <span className="text-[11px] font-black text-emerald-600">• {formatCurrency(grandTotal, organization.currency)}</span>
        </button>
      </div>

      <div className="min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4 sm:gap-6 w-full max-w-full min-w-0 relative">
        {/* LEFT: MEDICINE CATALOG & SEARCH */}
        <div
          className={cn(
            'flex-1 flex-col bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-4 overflow-hidden min-w-0 w-full',
            mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
          )}
        >
          {/* Search Bar */}
          <div className="relative mb-3 sm:mb-4">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 sm:left-3.5 top-3" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search medicine or scan barcode..."
              className="w-full pl-9 sm:pl-11 pr-20 sm:pr-28 py-2 sm:py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <div className="absolute right-2 sm:right-3 top-2 sm:top-2.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded">
              <Barcode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Scanner Ready</span>
              <span className="sm:hidden">Ready</span>
            </div>
          </div>

          {/* Medicines Grid */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
            {filteredMedicines.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
                <Pill className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold">No active medicines found matching "{searchTerm}"</p>
              </div>
            ) : (
              filteredMedicines.map((med) => {
                const activeBatch = med.batches[0]; // Earliest expiring batch
                const totalStock = med.batches.reduce((acc, b) => acc + b.quantity, 0);

                return (
                  <div
                    key={med.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      totalStock > 0
                        ? 'bg-slate-50/50 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'
                        : 'bg-slate-100/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-bold text-xs text-slate-900 line-clamp-1">{med.name}</h3>
                        {med.prescriptionRequired && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded shrink-0">
                            Rx
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        {med.genericName || med.brand || med.dosageForm || 'Medicine'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-emerald-700">
                          {activeBatch ? formatCurrency(activeBatch.sellingPrice, organization.currency) : 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Stock: <strong className={totalStock > 0 ? 'text-slate-800' : 'text-rose-600'}>{totalStock}</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => activeBatch && addToCart(med, activeBatch)}
                        disabled={!activeBatch || totalStock <= 0}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Mobile floating bar to jump to cart */}
          {mobileTab === 'catalog' && cart.length > 0 && (
            <div className="lg:hidden sticky bottom-0 pt-2 bg-gradient-to-t from-white via-white to-transparent">
              <button
                onClick={() => setMobileTab('cart')}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-600/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span>{cart.length} item{cart.length > 1 ? 's' : ''} in cart</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold">{formatCurrency(grandTotal, organization.currency)}</span>
                  <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded-md uppercase tracking-wider">Review Order &rarr;</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: CART & POS CHECKOUT */}
        <div
          className={cn(
            'w-full lg:w-[400px] xl:w-[420px] bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-4 flex-col justify-between shrink-0 min-w-0',
            mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'
          )}
        >
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600 shrink-0" />
              <h2 className="font-extrabold text-sm text-slate-900">Current POS Order</h2>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
              {cart.length} items
            </span>
          </div>

        {/* Customer Selector */}
        <div className="py-3 border-b border-slate-100">
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Customer Selection</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Walk-In Customer (Default)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone || c.email || 'Registered'})
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12 space-y-2">
              <ShoppingCart className="w-10 h-10 text-slate-200" />
              <p>Cart is empty. Click "+ Add" on medicines.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.batchId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{item.medicineName}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">Batch: {item.batchNumber}</span>
                  </div>
                  <button onClick={() => removeFromCart(item.batchId)} className="text-slate-400 hover:text-rose-600 p-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.batchId, -1)}
                      className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-slate-900 px-1">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.batchId, 1)}
                      className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right font-extrabold text-slate-900">
                    {formatCurrency(item.unitPrice * item.quantity, organization.currency)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="pt-3 border-t border-slate-200 space-y-3 bg-slate-50/80 p-3 rounded-xl">
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal, organization.currency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Discount ($)</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-20 p-1 text-right border border-slate-300 rounded text-xs font-semibold"
              />
            </div>
            <div className="flex justify-between">
              <span>Estimated Tax ({taxRate}%)</span>
              <span className="font-semibold">{formatCurrency(calculatedTax, organization.currency)}</span>
            </div>
          </div>

          {/* Payment Method selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
            {['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER'].map((pm) => (
              <button
                key={pm}
                onClick={() => setPaymentMethod(pm)}
                className={`py-1.5 px-1 rounded text-[10px] font-bold uppercase transition-all truncate text-center ${
                  paymentMethod === pm ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {pm.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-900">Grand Total</span>
            <span className="text-2xl font-black text-emerald-600">{formatCurrency(grandTotal, organization.currency)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={submitting || cart.length === 0}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Complete & Print Invoice <CheckCircle2 className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>

      {/* PRINTABLE RECEIPT MODAL */}
      {invoiceModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Official Pharmacy Invoice</h3>
              <button onClick={() => setInvoiceModalData(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-3 border border-slate-200 font-mono">
              <div className="text-center border-b pb-2">
                <h4 className="font-bold text-sm text-slate-900 uppercase">{organization.name}</h4>
                <p className="text-[10px] text-slate-500">{branch?.address || organization.address}</p>
                <p className="text-[10px] text-slate-500">Phone: {organization.phone}</p>
              </div>

              <div className="flex justify-between text-[11px]">
                <span>Inv No: <strong>{invoiceModalData.invoice.invoiceNumber}</strong></span>
                <span>{new Date(invoiceModalData.sale.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="space-y-1.5 border-t border-b py-2">
                {invoiceModalData.sale.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {item.medicine?.name} x{item.quantity}
                    </span>
                    <span>${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right pt-1">
                <div>Subtotal: ${invoiceModalData.sale.subtotal.toFixed(2)}</div>
                <div>Tax: ${invoiceModalData.sale.tax.toFixed(2)}</div>
                <div className="font-bold text-sm text-slate-900">Total: ${invoiceModalData.sale.total.toFixed(2)}</div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-500 border-t">
                Thank you for visiting {organization.name}!
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={() => setInvoiceModalData(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
