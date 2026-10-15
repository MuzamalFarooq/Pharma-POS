'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  Filter,
  Layers,
  Loader2,
  MoreVertical,
  Pill,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const DOSAGE_FORM_OPTIONS = [
  'Tablet',
  'Film-coated Tablet',
  'Chewable Tablet',
  'Effervescent Tablet',
  'Capsule',
  'Softgel Capsule',
  'Syrup',
  'Oral Suspension',
  'Oral Solution',
  'Injection / Ampoule',
  'Infusion (IV)',
  'Topical Cream',
  'Topical Ointment',
  'Gel',
  'Eye Drops',
  'Ear Drops',
  'Nasal Spray',
  'Metered Dose Inhaler',
  'Powder Sachet',
  'Suppository',
  'Lotion',
];

const COMMON_CATEGORIES = [
  'Pain Relief',
  'Antibiotics',
  'Cardiovascular',
  'Digestive Health',
  'Diabetes Care',
  'Allergy Care',
  'Vitamins & Supplements',
  'Respiratory Care',
  'Cough & Cold',
  'Skin Care',
  'Electrolytes',
  'Neurological & Mental Health',
  "Women's Health",
  'Pediatrics',
  'Ophthalmology',
];

const INITIAL_FORM_STATE = {
  name: '',
  genericName: '',
  brand: '',
  category: 'Pain Relief',
  dosageForm: 'Tablet',
  strength: '',
  manufacturer: '',
  barcode: '',
  sku: '',
  prescriptionRequired: false,
  standardPrice: '',
  packageSize: '',
  description: '',
  sideEffects: '',
  storageConditions: 'Store below 25°C in a dry place.',
  isActive: true,
};

export default function GlobalCatalogClient() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    prescription: 0,
    otc: 0,
    withBarcode: 0,
  });
  const [categories, setCategories] = useState([]);
  const [dosageForms, setDosageForms] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDosageForm, setSelectedDosageForm] = useState('ALL');
  const [selectedPrescription, setSelectedPrescription] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, totalCount: 0, totalPages: 1 });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch catalog from API
  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
        sortBy,
        sortOrder,
        ...(searchQuery ? { q: searchQuery } : {}),
        ...(selectedCategory !== 'ALL' ? { category: selectedCategory } : {}),
        ...(selectedDosageForm !== 'ALL' ? { dosageForm: selectedDosageForm } : {}),
        ...(selectedPrescription !== 'ALL' ? { prescription: selectedPrescription } : {}),
        ...(selectedStatus !== 'ALL' ? { status: selectedStatus } : {}),
      });

      const res = await fetch(`/api/owner/global-catalog?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load global catalog');
      }

      setItems(data.items || []);
      setPagination(data.pagination || { page: 1, limit: pageSize, totalCount: 0, totalPages: 1 });
      if (data.stats) setStats(data.stats);
      if (data.categories) setCategories(data.categories);
      if (data.dosageForms) setDosageForms(data.dosageForms);
    } catch (err) {
      toast.error(err.message || 'Error fetching global medicine catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [
    currentPage,
    pageSize,
    searchQuery,
    selectedCategory,
    selectedDosageForm,
    selectedPrescription,
    selectedStatus,
    sortBy,
    sortOrder,
  ]);

  // Handle open Add Modal
  const handleOpenAdd = () => {
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Handle open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      genericName: item.genericName || '',
      brand: item.brand || '',
      category: item.category || 'Pain Relief',
      dosageForm: item.dosageForm || 'Tablet',
      strength: item.strength || '',
      manufacturer: item.manufacturer || '',
      barcode: item.barcode || '',
      sku: item.sku || '',
      prescriptionRequired: Boolean(item.prescriptionRequired),
      standardPrice: item.standardPrice != null ? String(item.standardPrice) : '',
      packageSize: item.packageSize || '',
      description: item.description || '',
      sideEffects: item.sideEffects || '',
      storageConditions: item.storageConditions || 'Store below 25°C in a dry place.',
      isActive: Boolean(item.isActive),
    });
    setFormErrors({});
  };

  // Save Add or Edit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    if (!formData.name.trim()) {
      setFormErrors({ name: 'Medicine Name is required' });
      toast.error('Please enter a medicine name');
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = Boolean(editingItem);
      const url = isEdit ? `/api/owner/global-catalog/${editingItem.id}` : '/api/owner/global-catalog';
      const method = isEdit ? 'PATCH' : 'POST';

      const payload = {
        ...formData,
        standardPrice: formData.standardPrice === '' ? null : Number(formData.standardPrice),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          setFormErrors(data.details);
        }
        throw new Error(data.error || 'Failed to save medicine');
      }

      toast.success(isEdit ? `Updated "${data.item.name}"` : `Added "${data.item.name}" to global catalog`);
      setIsAddModalOpen(false);
      setEditingItem(null);
      fetchCatalog();
    } catch (err) {
      toast.error(err.message || 'Failed to save medicine');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (item) => {
    try {
      const newStatus = !item.isActive;
      const res = await fetch(`/api/owner/global-catalog/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      toast.success(`Medicine status changed to ${newStatus ? 'ACTIVE' : 'INACTIVE'}`);
      setItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, isActive: newStatus } : m)));
      setStats((prev) => ({
        ...prev,
        active: newStatus ? prev.active + 1 : prev.active - 1,
        inactive: newStatus ? prev.inactive - 1 : prev.inactive + 1,
      }));
    } catch (err) {
      toast.error(err.message || 'Status toggle failed');
    }
  };

  // Single delete
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/owner/global-catalog/${itemToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete medicine');

      toast.success(data.message || `Deleted "${itemToDelete.name}" from catalog`);
      setItemToDelete(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(itemToDelete.id);
        return next;
      });
      fetchCatalog();
    } catch (err) {
      toast.error(err.message || 'Delete operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;
    if (action === 'DELETE' && !confirm(`Are you sure you want to delete ${selectedIds.size} medicines permanently?`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/owner/global-catalog/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ids: Array.from(selectedIds),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk operation failed');

      toast.success(data.message);
      setSelectedIds(new Set());
      fetchCatalog();
    } catch (err) {
      toast.error(err.message || 'Bulk operation failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Seed standards
  const handleSeedStandards = async () => {
    if (!confirm('Load/Update the standard WHO essential medicines formulary into the global catalog?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/owner/global-catalog/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEED_STANDARDS' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Seeding failed');

      toast.success(data.message);
      fetchCatalog();
    } catch (err) {
      toast.error(err.message || 'Seeding failed');
      setLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const params = new URLSearchParams({
      format: 'csv',
      sortBy,
      sortOrder,
      ...(searchQuery ? { q: searchQuery } : {}),
      ...(selectedCategory !== 'ALL' ? { category: selectedCategory } : {}),
      ...(selectedDosageForm !== 'ALL' ? { dosageForm: selectedDosageForm } : {}),
      ...(selectedPrescription !== 'ALL' ? { prescription: selectedPrescription } : {}),
      ...(selectedStatus !== 'ALL' ? { status: selectedStatus } : {}),
    });
    window.open(`/api/owner/global-catalog?${params.toString()}`, '_blank');
  };

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Copy code helper
  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(`Copied "${text}" to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Global Medicine Catalog
              </h1>
              <p className="text-xs text-slate-500">
                Centralized master pharmaceutical database, regulatory standards, formulations, and MSRP pricing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition"
            title="Export filtered records to CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleSeedStandards}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition"
            title="Load standard formulary templates"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Sync Standards
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-700/20 hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Global Medicine
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Catalog Items</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.total}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Master formulary formulations</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Formulations</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{stats.active}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{stats.inactive} deprecated / inactive</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Prescription Rx</p>
          <p className="mt-1 text-2xl font-black text-amber-700">{stats.prescription}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{stats.otc} Over-the-counter (OTC)</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Verified Barcodes</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{stats.withBarcode}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Universal EAN/UPC scanned</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by drug name, active ingredient, brand, manufacturer, barcode, or SKU..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-9 text-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Categories</option>
              {Array.from(new Set([...COMMON_CATEGORIES, ...categories])).sort().map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Dosage Form Filter */}
            <select
              value={selectedDosageForm}
              onChange={(e) => {
                setSelectedDosageForm(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Dosage Forms</option>
              {Array.from(new Set([...DOSAGE_FORM_OPTIONS, ...dosageForms])).sort().map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Prescription Filter */}
            <select
              value={selectedPrescription}
              onChange={(e) => {
                setSelectedPrescription(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Rx / OTC</option>
              <option value="RX">Prescription (Rx) Only</option>
              <option value="OTC">Over-The-Counter (OTC)</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive / Deprecated</option>
            </select>

            {(searchQuery ||
              selectedCategory !== 'ALL' ||
              selectedDosageForm !== 'ALL' ||
              selectedPrescription !== 'ALL' ||
              selectedStatus !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedDosageForm('ALL');
                  setSelectedPrescription('ALL');
                  setSelectedStatus('ALL');
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Bulk Action Bar (when rows selected) */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                {selectedIds.size}
              </span>
              <span className="font-bold text-emerald-900">
                {selectedIds.size} {selectedIds.size === 1 ? 'medicine' : 'medicines'} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={bulkActionLoading}
                onClick={() => handleBulkAction('ACTIVATE')}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Bulk Activate
              </button>
              <button
                type="button"
                disabled={bulkActionLoading}
                onClick={() => handleBulkAction('DEACTIVATE')}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1.5 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Bulk Deactivate
              </button>
              <button
                type="button"
                disabled={bulkActionLoading}
                onClick={() => handleBulkAction('DELETE')}
                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Bulk Delete
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Catalog Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-240 text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.size === items.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    aria-label="Select all rows"
                  />
                </th>
                <th className="px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else {
                        setSortBy('name');
                        setSortOrder('asc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    Product & Active Formula
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-5 py-3.5">Category & Form</th>
                <th className="px-5 py-3.5">Barcode & SKU</th>
                <th className="px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (sortBy === 'standardPrice') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else {
                        setSortBy('standardPrice');
                        setSortOrder('asc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    MSRP / Standard
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-5 py-3.5">Prescription</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Pharmacy Usage</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-slate-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <p className="mt-2 text-xs font-semibold">Loading global medicine catalog...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center text-slate-500">
                    <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-2 font-bold text-slate-700">No global medicine records found</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try clearing filters, or click &quot;Sync Standards&quot; to load default WHO essential medicines.
                    </p>
                    <button
                      type="button"
                      onClick={handleSeedStandards}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      Load Standard Formulary
                    </button>
                  </td>
                </tr>
              ) : (
                items.map((med) => {
                  const isSelected = selectedIds.has(med.id);
                  return (
                    <tr
                      key={med.id}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(med.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          aria-label={`Select ${med.name}`}
                        />
                      </td>

                      {/* Product Name & Generic Formula */}
                      <td className="px-5 py-3.5 max-w-72">
                        <div className="flex items-start gap-2">
                          <div>
                            <button
                              type="button"
                              onClick={() => setViewingItem(med)}
                              className="text-left font-bold text-slate-900 hover:text-emerald-700 transition"
                            >
                              {med.name}
                            </button>
                            <p className="text-[11px] font-medium text-emerald-700">
                              {med.genericName || 'Formulation not specified'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {[med.brand && `Brand: ${med.brand}`, med.manufacturer && `Mfg: ${med.manufacturer}`]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Classification & Dosage */}
                      <td className="px-5 py-3.5">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {med.category || 'General'}
                        </span>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-800">
                          {med.dosageForm || 'Dosage form N/A'}
                          {med.strength ? ` (${med.strength})` : ''}
                        </p>
                        {med.packageSize && (
                          <p className="text-[10px] text-slate-400 truncate max-w-44">{med.packageSize}</p>
                        )}
                      </td>

                      {/* Barcode & SKU */}
                      <td className="px-5 py-3.5 font-mono text-[10px]">
                        {med.barcode ? (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5">{med.barcode}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(med.barcode, `bar-${med.id}`)}
                              className="text-slate-400 hover:text-slate-700"
                              title="Copy barcode"
                            >
                              {copiedId === `bar-${med.id}` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300">No barcode</span>
                        )}
                        {med.sku && (
                          <p className="mt-0.5 text-[9px] text-slate-400">SKU: {med.sku}</p>
                        )}
                      </td>

                      {/* Standard Price */}
                      <td className="px-5 py-3.5">
                        {med.standardPrice != null ? (
                          <div>
                            <span className="font-extrabold text-slate-900">
                              ${med.standardPrice.toFixed(2)}
                            </span>
                            <p className="text-[9px] text-slate-400 uppercase">Rec. MSRP</p>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Prescription Rx */}
                      <td className="px-5 py-3.5">
                        {med.prescriptionRequired ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            <ShieldAlert className="h-3 w-3" /> Rx Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            OTC
                          </span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(med)}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition hover:opacity-80 ${
                            med.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                          title="Click to toggle status"
                        >
                          {med.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Pharmacy Adoption */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold text-slate-700">
                          {med._count?.medicines || 0}
                        </span>
                        <p className="text-[9px] text-slate-400">Pharmacies</p>
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingItem(med)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                            title="View specifications & clinical details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(med)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-700"
                            title="Edit catalog entry"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(med)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete medicine"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 text-xs text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <span>
              Showing {items.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
              <strong className="font-bold text-slate-800">{pagination.totalCount}</strong> medicines
            </span>
            <span className="text-slate-300">|</span>
            <label className="flex items-center gap-1.5 text-[11px]">
              Page Size:
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-700 outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-slate-800">
              {currentPage} / {pagination.totalPages || 1}
            </span>
            <button
              type="button"
              disabled={currentPage >= pagination.totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT MEDICINE MODAL */}
      {/* ========================================================================= */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Pill className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {editingItem ? 'Edit Global Medicine' : 'Add New Global Medicine'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {editingItem
                      ? `Update specifications for ${editingItem.name}`
                      : 'Define master drug formulation for the platform catalog'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="max-h-[75vh] overflow-y-auto p-6 space-y-5 text-xs">
              {/* Core Drug Information */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-3">
                  1. Identification & Nomenclature
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Product Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Panadol Extra 500mg, Augmentin 625mg"
                      className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-[11px] text-rose-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Generic Name / Active Formulation
                    </label>
                    <input
                      type="text"
                      value={formData.genericName}
                      onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                      placeholder="e.g. Paracetamol + Caffeine, Amoxicillin"
                      className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. Panadol, Augmentin, Brufen"
                      className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Manufacturer</label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      placeholder="e.g. GSK, Abbott, Pfizer, Getz Pharma"
                      className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Therapeutic Category</label>
                    <input
                      list="category-suggestions"
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Select or enter category..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                    />
                    <datalist id="category-suggestions">
                      {COMMON_CATEGORIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Formulation & Packaging */}
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-3">
                  2. Formulation & Packaging Specifications
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dosage Form</label>
                    <select
                      value={formData.dosageForm}
                      onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 outline-none focus:border-emerald-500"
                    >
                      {DOSAGE_FORM_OPTIONS.map((df) => (
                        <option key={df} value={df}>
                          {df}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Strength / Potency</label>
                    <input
                      type="text"
                      value={formData.strength}
                      onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                      placeholder="e.g. 500mg, 10mg/5ml"
                      className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Package Size</label>
                    <input
                      type="text"
                      value={formData.packageSize}
                      onChange={(e) => setFormData({ ...formData, packageSize: e.target.value })}
                      placeholder="e.g. Box of 100 (10x10), 120ml"
                      className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Codes & Regulatory */}
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-3">
                  3. Identifiers, Regulatory & Pricing
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Standard Barcode (EAN / UPC)</label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="e.g. 8964000120101"
                      className="w-full font-mono rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SKU / National Drug Code</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g. PAN-EXT-500"
                      className="w-full font-mono rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Standard MSRP ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.standardPrice}
                      onChange={(e) => setFormData({ ...formData, standardPrice: e.target.value })}
                      placeholder="e.g. 12.50"
                      className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.prescriptionRequired}
                      onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-slate-800">Prescription Required (Rx)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-800">Active in Catalog</span>
                  </label>
                </div>
              </div>

              {/* Clinical Indications & Instructions */}
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-3">
                  4. Clinical Notes, Storage & Warnings
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Clinical Indications & Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Primary indications, mechanism, and therapeutic uses..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Side Effects & Contraindications</label>
                    <textarea
                      rows={2}
                      value={formData.sideEffects}
                      onChange={(e) => setFormData({ ...formData, sideEffects: e.target.value })}
                      placeholder="Known adverse reactions, precautions, and contraindications..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Storage Conditions</label>
                    <input
                      type="text"
                      value={formData.storageConditions}
                      onChange={(e) => setFormData({ ...formData, storageConditions: e.target.value })}
                      placeholder="e.g. Store below 25°C in a dry place protected from sunlight."
                      className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingItem ? 'Save Changes' : 'Create Global Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW DETAILS MODAL */}
      {/* ========================================================================= */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="relative my-8 w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">{viewingItem.name}</h2>
                  <p className="text-[11px] font-medium text-emerald-700">
                    {viewingItem.genericName || 'Formula not provided'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800">
                  {viewingItem.category || 'General'}
                </span>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                  {viewingItem.dosageForm || 'Dosage Form N/A'}
                </span>
                {viewingItem.strength && (
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                    Strength: {viewingItem.strength}
                  </span>
                )}
                {viewingItem.prescriptionRequired ? (
                  <span className="rounded-md bg-amber-100 px-2.5 py-1 font-bold text-amber-900">
                    Prescription Rx Only
                  </span>
                ) : (
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                    Over-The-Counter (OTC)
                  </span>
                )}
                <span
                  className={`rounded-md px-2.5 py-1 font-bold ${
                    viewingItem.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {viewingItem.isActive ? 'Active Catalog Item' : 'Inactive / Deprecated'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Brand Name</span>
                  <span className="font-semibold text-slate-800">{viewingItem.brand || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Manufacturer</span>
                  <span className="font-semibold text-slate-800">{viewingItem.manufacturer || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Standard Barcode</span>
                  <span className="font-mono font-semibold text-slate-800">{viewingItem.barcode || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">SKU / Code</span>
                  <span className="font-mono font-semibold text-slate-800">{viewingItem.sku || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Package Presentation</span>
                  <span className="font-semibold text-slate-800">{viewingItem.packageSize || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Recommended MSRP</span>
                  <span className="font-extrabold text-slate-900">
                    {viewingItem.standardPrice != null ? `$${viewingItem.standardPrice.toFixed(2)}` : '—'}
                  </span>
                </div>
              </div>

              {viewingItem.description && (
                <div>
                  <h4 className="font-bold text-slate-900">Clinical Indications & Overview</h4>
                  <p className="mt-1 text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {viewingItem.description}
                  </p>
                </div>
              )}

              {viewingItem.sideEffects && (
                <div>
                  <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                    Adverse Reactions & Precautions
                  </h4>
                  <p className="mt-1 text-rose-800/90 leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    {viewingItem.sideEffects}
                  </p>
                </div>
              )}

              {viewingItem.storageConditions && (
                <div>
                  <h4 className="font-bold text-slate-800">Storage & Handling Instructions</h4>
                  <p className="mt-1 text-slate-600">{viewingItem.storageConditions}</p>
                </div>
              )}

              <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 flex justify-between">
                <span>Created: {new Date(viewingItem.createdAt).toLocaleString()}</span>
                <span>Last Updated: {new Date(viewingItem.updatedAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
              <button
                type="button"
                onClick={() => {
                  const item = viewingItem;
                  setViewingItem(null);
                  handleOpenEdit(item);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Medicine
              </button>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Global Medicine</h3>
                <p className="text-xs text-slate-500">This action will permanently delete this catalog record.</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-900">
              <p className="font-bold">{itemToDelete.name}</p>
              <p className="text-[11px] text-rose-700">{itemToDelete.genericName || 'No generic formula'}</p>
              {itemToDelete._count?.medicines > 0 && (
                <p className="mt-2 text-[11px] font-semibold text-rose-800">
                  ⚠️ Note: {itemToDelete._count.medicines} pharmacy inventory records currently reference this
                  medicine. Deleting it will safely unlink them from this global record.
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setItemToDelete(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
