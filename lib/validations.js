import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must match'),
  pharmacyName: z.string().min(2, 'Pharmacy name must be at least 2 characters'),
  phone: z.string().min(5, 'Valid phone number is required'),
  pharmacyEmail: z.string().email('Invalid pharmacy email address').optional().or(z.literal('')),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  country: z.string().default('USA'),
  postalCode: z.string().optional(),
  licenseNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  genericName: z.string().optional(),
  brand: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  manufacturer: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  prescriptionRequired: z.boolean().default(false),
  description: z.string().optional(),
});

export const batchSchema = z.object({
  medicineId: z.string().min(1, 'Medicine selection is required'),
  supplierId: z.string().optional().nullable(),
  batchNumber: z.string().min(1, 'Batch number is required'),
  purchasePrice: z.number().min(0, 'Purchase price must be positive'),
  sellingPrice: z.number().min(0, 'Selling price must be positive'),
  quantity: z.number().int().min(0, 'Quantity must be 0 or greater'),
  minStock: z.number().int().min(0).default(10),
  manufacturingDate: z.string().optional().nullable(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
});

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  branchId: z.string().optional(),
  invoiceRef: z.string().optional(),
  items: z.array(
    z.object({
      medicineId: z.string().min(1, 'Medicine is required'),
      batchNumber: z.string().min(1, 'Batch number is required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      purchasePrice: z.number().min(0, 'Purchase price required'),
      sellingPrice: z.number().min(0, 'Selling price required'),
      expiryDate: z.string().min(1, 'Expiry date required'),
    })
  ).min(1, 'At least one medicine item is required'),
});

export const saleSchema = z.object({
  customerId: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER']).default('CASH'),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  items: z.array(
    z.object({
      medicineId: z.string().min(1, 'Medicine is required'),
      batchId: z.string().min(1, 'Batch is required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      unitPrice: z.number().min(0, 'Unit price required'),
      discount: z.number().min(0).default(0),
    })
  ).min(1, 'Cart cannot be empty'),
});

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier company name is required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

export const staffInviteSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MANAGER', 'PHARMACIST', 'CASHIER', 'STAFF']),
  branchId: z.string().optional().nullable(),
});

export const branchSchema = z.object({
  name: z.string().min(2, 'Branch name is required'),
  code: z.string().min(2, 'Branch code is required (e.g. MAIN, DOWNTOWN)'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});

export const settingsSchema = z.object({
  name: z.string().min(2, 'Pharmacy name is required'),
  phone: z.string().min(3, 'Phone is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  country: z.string().default('USA'),
  postalCode: z.string().optional(),
  licenseNumber: z.string().optional(),
  currency: z.string().default('USD'),
  taxRate: z.number().min(0).max(100).default(0),
  invoicePrefix: z.string().min(1).default('INV'),
});
