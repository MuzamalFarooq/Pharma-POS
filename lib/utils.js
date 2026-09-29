import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = 'USD') {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateExpiryStatus(expiryDateStr) {
  if (!expiryDateStr) return { status: 'NORMAL', label: 'Good', days: 9999 };
  const now = new Date();
  const exp = new Date(expiryDateStr);
  const diffTime = exp - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { status: 'EXPIRED', label: 'Expired', days: diffDays };
  } else if (diffDays <= 30) {
    return { status: 'CRITICAL', label: `Expires in ${diffDays} days`, days: diffDays };
  } else if (diffDays <= 90) {
    return { status: 'WARNING', label: `Expires in ${diffDays} days`, days: diffDays };
  } else {
    return { status: 'NORMAL', label: `Expires in ${diffDays} days`, days: diffDays };
  }
}
