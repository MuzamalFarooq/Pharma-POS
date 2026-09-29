import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING PHARMACY POS MULTI-TENANT SAAS DATABASE ---');

  // Clean DB
  await prisma.saleItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.purchaseItem.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.medicineBatch.deleteMany({});
  await prisma.medicine.deleteMany({});
  await prisma.medicineCategory.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.organizationMember.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. CREATE USER 1 (Owner of City Care Pharmacy)
  const user1 = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Jenkins',
      email: 'owner@citycare.com',
      passwordHash,
    },
  });

  // 2. CREATE ORGANIZATION 1 (City Care Pharmacy)
  const org1 = await prisma.organization.create({
    data: {
      name: 'City Care Pharmacy',
      slug: 'city-care-pharmacy',
      code: 'CITY',
      email: 'contact@citycare.com',
      phone: '+1 (555) 019-2834',
      address: '124 Medical Center Blvd',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postalCode: '10001',
      licenseNumber: 'PHARM-NY-98231',
      invoicePrefix: 'CITY-INV',
      currency: 'USD',
      taxRate: 5.0,
      subscriptionPlan: 'PRO',
      subscriptionStatus: 'ACTIVE',
    },
  });

  const branch1Main = await prisma.branch.create({
    data: {
      organizationId: org1.id,
      name: 'Main Downtown Branch',
      code: 'MAIN',
      phone: '+1 (555) 019-2834',
      address: '124 Medical Center Blvd',
      city: 'New York',
      isMain: true,
    },
  });

  const branch1North = await prisma.branch.create({
    data: {
      organizationId: org1.id,
      name: 'Northside Clinic Branch',
      code: 'NORTH',
      phone: '+1 (555) 019-9988',
      address: '880 North Ave',
      city: 'New York',
      isMain: false,
    },
  });

  await prisma.organizationMember.create({
    data: {
      userId: user1.id,
      organizationId: org1.id,
      role: 'OWNER',
      branchId: branch1Main.id,
    },
  });

  // Staff for Org 1
  const user1Staff = await prisma.user.create({
    data: {
      name: 'Alex Rivera (Cashier)',
      email: 'cashier@citycare.com',
      passwordHash,
    },
  });

  await prisma.organizationMember.create({
    data: {
      userId: user1Staff.id,
      organizationId: org1.id,
      role: 'CASHIER',
      branchId: branch1Main.id,
    },
  });

  // Org 1 Categories
  const catAntibiotics = await prisma.medicineCategory.create({
    data: { organizationId: org1.id, name: 'Antibiotics', description: 'Bacterial infection treatments' },
  });
  const catPain = await prisma.medicineCategory.create({
    data: { organizationId: org1.id, name: 'Pain Relief & Analgesics', description: 'Pain management' },
  });
  const catCardio = await prisma.medicineCategory.create({
    data: { organizationId: org1.id, name: 'Cardiovascular', description: 'Blood pressure & heart' },
  });

  // Org 1 Suppliers
  const suppPfizer = await prisma.supplier.create({
    data: {
      organizationId: org1.id,
      name: 'PharmaDistributors Inc.',
      contactPerson: 'Robert Vance',
      phone: '+1 (555) 321-4567',
      email: 'sales@pharmadist.com',
      address: '500 Logistics Way, NJ',
      taxId: 'TAX-9901-NJ',
    },
  });

  // Org 1 Customers
  const cust1 = await prisma.customer.create({
    data: {
      organizationId: org1.id,
      name: 'John Doe',
      phone: '+1 (555) 888-1234',
      email: 'johndoe@email.com',
      address: '42 Wall Street',
      totalSpent: 125.5,
    },
  });

  // Org 1 Medicines
  const medAmoxicillin = await prisma.medicine.create({
    data: {
      organizationId: org1.id,
      categoryId: catAntibiotics.id,
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin Trihydrate',
      brand: 'Amoxil',
      dosageForm: 'Capsule',
      strength: '500mg',
      manufacturer: 'GSK',
      barcode: '890123456701',
      sku: 'AMX-500-CAP',
      prescriptionRequired: true,
      description: 'Broad-spectrum antibiotic capsule',
    },
  });

  const medParacetamol = await prisma.medicine.create({
    data: {
      organizationId: org1.id,
      categoryId: catPain.id,
      name: 'Paracetamol 500mg Extra',
      genericName: 'Acetaminophen',
      brand: 'Panadol',
      dosageForm: 'Tablet',
      strength: '500mg',
      manufacturer: 'Haleon',
      barcode: '890123456702',
      sku: 'PAR-500-TAB',
      prescriptionRequired: false,
      description: 'Fast acting pain reliever and fever reducer',
    },
  });

  const medLipitor = await prisma.medicine.create({
    data: {
      organizationId: org1.id,
      categoryId: catCardio.id,
      name: 'Atorvastatin 20mg',
      genericName: 'Atorvastatin Calcium',
      brand: 'Lipitor',
      dosageForm: 'Tablet',
      strength: '20mg',
      manufacturer: 'Pfizer',
      barcode: '890123456703',
      sku: 'LIP-20-TAB',
      prescriptionRequired: true,
      description: 'Statin medication to lower cholesterol',
    },
  });

  // Org 1 Batches
  const batch1 = await prisma.medicineBatch.create({
    data: {
      organizationId: org1.id,
      branchId: branch1Main.id,
      medicineId: medAmoxicillin.id,
      supplierId: suppPfizer.id,
      batchNumber: 'B2026-AMX-01',
      purchasePrice: 12.0,
      sellingPrice: 24.5,
      quantity: 150,
      minStock: 20,
      expiryDate: new Date('2027-08-15'),
    },
  });

  // Expiring batch for test
  const batchExpiring = await prisma.medicineBatch.create({
    data: {
      organizationId: org1.id,
      branchId: branch1Main.id,
      medicineId: medParacetamol.id,
      supplierId: suppPfizer.id,
      batchNumber: 'B2026-PAR-EXP',
      purchasePrice: 3.5,
      sellingPrice: 8.0,
      quantity: 15,
      minStock: 30,
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    },
  });

  const batchNormal = await prisma.medicineBatch.create({
    data: {
      organizationId: org1.id,
      branchId: branch1Main.id,
      medicineId: medLipitor.id,
      supplierId: suppPfizer.id,
      batchNumber: 'B2026-LIP-99',
      purchasePrice: 18.0,
      sellingPrice: 35.0,
      quantity: 80,
      minStock: 15,
      expiryDate: new Date('2028-01-10'),
    },
  });

  // Sale & Invoice for Org 1
  const sale1 = await prisma.sale.create({
    data: {
      organizationId: org1.id,
      branchId: branch1Main.id,
      saleNumber: 'SALE-000001',
      customerId: cust1.id,
      cashierId: user1.id,
      subtotal: 32.5,
      discount: 2.5,
      tax: 1.5,
      total: 31.5,
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      items: {
        create: [
          {
            medicineId: medAmoxicillin.id,
            batchId: batch1.id,
            quantity: 1,
            unitPrice: 24.5,
            discount: 0.0,
            total: 24.5,
          },
          {
            medicineId: medParacetamol.id,
            batchId: batchExpiring.id,
            quantity: 1,
            unitPrice: 8.0,
            discount: 0.0,
            total: 8.0,
          },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      organizationId: org1.id,
      branchId: branch1Main.id,
      invoiceNumber: 'CITY-INV-000001',
      saleId: sale1.id,
      customerId: cust1.id,
      amount: 31.5,
      status: 'PAID',
    },
  });

  // ==========================================
  // 3. CREATE ORGANIZATION 2 (Medico Plus Pharmacy - TENANT B)
  // ==========================================
  const user2 = await prisma.user.create({
    data: {
      name: 'Dr. Michael Chang',
      email: 'owner@medicoplus.com',
      passwordHash,
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: 'Medico Plus Pharmacy',
      slug: 'medico-plus-pharmacy',
      code: 'MEDICO',
      email: 'support@medicoplus.com',
      phone: '+1 (555) 901-7766',
      address: '77 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      country: 'USA',
      postalCode: '33139',
      licenseNumber: 'PHARM-FL-44119',
      invoicePrefix: 'MEDICO-INV',
      currency: 'USD',
      taxRate: 7.0,
      subscriptionPlan: 'FREE',
      subscriptionStatus: 'ACTIVE',
    },
  });

  const branch2Main = await prisma.branch.create({
    data: {
      organizationId: org2.id,
      name: 'Medico Central',
      code: 'MAIN',
      phone: '+1 (555) 901-7766',
      address: '77 Ocean Drive',
      city: 'Miami',
      isMain: true,
    },
  });

  await prisma.organizationMember.create({
    data: {
      userId: user2.id,
      organizationId: org2.id,
      role: 'OWNER',
      branchId: branch2Main.id,
    },
  });

  const medVitaminC = await prisma.medicine.create({
    data: {
      organizationId: org2.id,
      name: 'Vitamin C 1000mg Effervescent',
      genericName: 'Ascorbic Acid',
      brand: 'Redoxon',
      dosageForm: 'Effervescent Tablet',
      strength: '1000mg',
      manufacturer: 'Bayer',
      barcode: '990123456799',
      sku: 'VIT-1000-TAB',
      prescriptionRequired: false,
      description: 'High strength Vitamin C dietary supplement',
    },
  });

  await prisma.medicineBatch.create({
    data: {
      organizationId: org2.id,
      branchId: branch2Main.id,
      medicineId: medVitaminC.id,
      batchNumber: 'B2026-MEDICO-01',
      purchasePrice: 4.0,
      sellingPrice: 12.0,
      quantity: 50,
      minStock: 10,
      expiryDate: new Date('2027-12-31'),
    },
  });

  console.log('✅ SEEDING COMPLETE!');
  console.log('Tenant A (City Care): owner@citycare.com / Password123!');
  console.log('Tenant A Staff: cashier@citycare.com / Password123!');
  console.log('Tenant B (Medico Plus): owner@medicoplus.com / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
