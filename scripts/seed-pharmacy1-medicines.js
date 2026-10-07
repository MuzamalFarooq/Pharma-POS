import { randomUUID } from 'node:crypto';
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const organizationSlug = 'pharmacy1-1259';
const branchCode = 'MAIN';
const categories = [
  'Pain Relief',
  'Allergy Care',
  'Digestive Health',
  'Cardiovascular',
  'Diabetes Care',
  'Vitamins & Supplements',
  'Cough & Cold',
  'Skin Care',
  'Electrolytes',
];

const products = [
  { genericName: 'Acetaminophen', label: 'Acetaminophen', category: 'Pain Relief', form: 'Tablet', strengths: ['325mg', '500mg', '650mg', '1000mg'], prescriptionRequired: false, image: 'tablets.svg' },
  { genericName: 'Ibuprofen', label: 'Ibuprofen', category: 'Pain Relief', form: 'Tablet', strengths: ['200mg', '400mg', '600mg', '800mg'], prescriptionRequired: false, image: 'tablets.svg' },
  { genericName: 'Aspirin', label: 'Aspirin', category: 'Pain Relief', form: 'Tablet', strengths: ['81mg', '162mg', '325mg', '500mg'], prescriptionRequired: false, image: 'tablets.svg' },
  { genericName: 'Naproxen', label: 'Naproxen', category: 'Pain Relief', form: 'Tablet', strengths: ['220mg', '250mg', '375mg', '500mg'], prescriptionRequired: true, image: 'tablets.svg' },
  { genericName: 'Cetirizine', label: 'Cetirizine', category: 'Allergy Care', form: 'Tablet', strengths: ['5mg', '10mg', '20mg', '30mg'], prescriptionRequired: false, image: 'tablets.svg' },
  { genericName: 'Loratadine', label: 'Loratadine', category: 'Allergy Care', form: 'Tablet', strengths: ['5mg', '10mg', '20mg', '30mg'], prescriptionRequired: false, image: 'tablets.svg' },
  { genericName: 'Fexofenadine', label: 'Fexofenadine', category: 'Allergy Care', form: 'Tablet', strengths: ['30mg', '60mg', '120mg', '180mg'], prescriptionRequired: false, image: 'tablets.svg' },
  { genericName: 'Omeprazole', label: 'Omeprazole', category: 'Digestive Health', form: 'Capsule', strengths: ['10mg', '20mg', '40mg', '80mg'], prescriptionRequired: false, image: 'capsules.svg' },
  { genericName: 'Famotidine', label: 'Famotidine', category: 'Digestive Health', form: 'Tablet', strengths: ['10mg', '20mg', '40mg', '80mg'], prescriptionRequired: false, image: 'tablets.svg' },
  { genericName: 'Calcium carbonate', label: 'Calcium Carbonate', category: 'Digestive Health', form: 'Chewable tablet', strengths: ['500mg', '750mg', '1000mg', '1250mg'], prescriptionRequired: false, image: 'tablets.svg' },
  { genericName: 'Metformin', label: 'Metformin', category: 'Diabetes Care', form: 'Tablet', strengths: ['250mg', '500mg', '850mg', '1000mg'], prescriptionRequired: true, image: 'tablets.svg' },
  { genericName: 'Amlodipine', label: 'Amlodipine', category: 'Cardiovascular', form: 'Tablet', strengths: ['2.5mg', '5mg', '7.5mg', '10mg'], prescriptionRequired: true, image: 'tablets.svg' },
  { genericName: 'Losartan', label: 'Losartan', category: 'Cardiovascular', form: 'Tablet', strengths: ['25mg', '50mg', '75mg', '100mg'], prescriptionRequired: true, image: 'tablets.svg' },
  { genericName: 'Atorvastatin', label: 'Atorvastatin', category: 'Cardiovascular', form: 'Tablet', strengths: ['10mg', '20mg', '40mg', '80mg'], prescriptionRequired: true, image: 'tablets.svg' },
  { genericName: 'Simvastatin', label: 'Simvastatin', category: 'Cardiovascular', form: 'Tablet', strengths: ['5mg', '10mg', '20mg', '40mg'], prescriptionRequired: true, image: 'tablets.svg' },
  { genericName: 'Ascorbic acid', label: 'Vitamin C', category: 'Vitamins & Supplements', form: 'Tablet', strengths: ['250mg', '500mg', '750mg', '1000mg'], prescriptionRequired: false, image: 'vitamins.svg' },
  { genericName: 'Cholecalciferol', label: 'Vitamin D3', category: 'Vitamins & Supplements', form: 'Softgel', strengths: ['400IU', '1000IU', '2000IU', '5000IU'], prescriptionRequired: false, image: 'vitamins.svg' },
  { genericName: 'Zinc sulfate', label: 'Zinc', category: 'Vitamins & Supplements', form: 'Tablet', strengths: ['10mg', '15mg', '25mg', '50mg'], prescriptionRequired: false, image: 'vitamins.svg' },
  { genericName: 'Ferrous sulfate', label: 'Ferrous Sulfate', category: 'Vitamins & Supplements', form: 'Tablet', strengths: ['65mg', '130mg', '195mg', '325mg'], prescriptionRequired: false, image: 'vitamins.svg' },
  { genericName: 'Folic acid', label: 'Folic Acid', category: 'Vitamins & Supplements', form: 'Tablet', strengths: ['400mcg', '800mcg', '1mg', '5mg'], prescriptionRequired: false, image: 'vitamins.svg' },
  { genericName: 'Dextromethorphan', label: 'Dextromethorphan', category: 'Cough & Cold', form: 'Syrup', strengths: ['5mg/5mL', '10mg/5mL', '15mg/5mL', '20mg/5mL'], prescriptionRequired: false, image: 'liquid.svg' },
  { genericName: 'Guaifenesin', label: 'Guaifenesin', category: 'Cough & Cold', form: 'Syrup', strengths: ['100mg/5mL', '200mg/5mL', '300mg/5mL', '400mg/5mL'], prescriptionRequired: false, image: 'liquid.svg' },
  { genericName: 'Hydrocortisone', label: 'Hydrocortisone', category: 'Skin Care', form: 'Cream', strengths: ['0.5%', '1%', '1.5%', '2%'], prescriptionRequired: false, image: 'topical.svg' },
  { genericName: 'Calamine', label: 'Calamine', category: 'Skin Care', form: 'Lotion', strengths: ['5%', '8%', '10%', '15%'], prescriptionRequired: false, image: 'topical.svg' },
  { genericName: 'Oral rehydration salts', label: 'Oral Rehydration Salts', category: 'Electrolytes', form: 'Powder sachet', strengths: ['10.5g', '15g', '20.5g', '27.9g'], prescriptionRequired: false, image: 'first-aid.svg' },
];

const imageFor = (filename) => `/images/medicines/${filename}`;

const medicineData = products.flatMap((product, productIndex) =>
  product.strengths.map((strength, strengthIndex) => {
    const number = productIndex * 4 + strengthIndex + 1;
    const code = String(number).padStart(3, '0');
    return {
      sku: `PP-DEMO-${code}`,
      category: product.category,
      name: `${product.label} ${strength}`,
      genericName: product.genericName,
      brand: ['DailyCare', 'WellSpring', 'Northstar Health', 'Evergreen'][number % 4],
      dosageForm: product.form,
      strength,
      manufacturer: 'Demo Pharmaceutical Co.',
      imageUrl: imageFor(product.image),
      prescriptionRequired: product.prescriptionRequired,
      description: `Demonstration catalog item for ${product.category.toLowerCase()}.`,
      quantity: 20 + ((number * 37) % 81),
      sellingPrice: Number((3.5 + ((number * 173) % 2400) / 100).toFixed(2)),
      purchasePrice: Number((1.25 + ((number * 97) % 1100) / 100).toFixed(2)),
      batchNumber: `DEMO-2026-${code}`,
    };
  })
);

if (medicineData.length !== 100) {
  throw new Error(`Expected 100 generated medicines; got ${medicineData.length}.`);
}

async function main() {
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify({
      dryRun: true,
      totalDemoMedicines: medicineData.length,
      uniqueSkus: new Set(medicineData.map((medicine) => medicine.sku)).size,
      categories: [...new Set(medicineData.map((medicine) => medicine.category))].length,
    }));
    return;
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
    select: { id: true, name: true },
  });
  if (!organization) throw new Error(`Pharmacy "${organizationSlug}" was not found.`);

  const branch = await prisma.branch.findFirst({
    where: { organizationId: organization.id, code: branchCode, status: 'ACTIVE' },
    select: { id: true, name: true },
  });
  if (!branch) throw new Error(`Active ${branchCode} branch not found for pharmacy "${organization.name}".`);

  await prisma.medicineCategory.createMany({
    data: categories.map((name) => ({
      organizationId: organization.id,
      name,
      description: 'Demo storefront category',
    })),
    skipDuplicates: true,
  });

  const pharmacyCategories = await prisma.medicineCategory.findMany({
    where: { organizationId: organization.id, name: { in: categories } },
    select: { id: true, name: true },
  });
  const categoryIds = new Map(pharmacyCategories.map((category) => [category.name, category.id]));
  const skus = medicineData.map((medicine) => medicine.sku);
  const existing = await prisma.medicine.findMany({
    where: { organizationId: organization.id, sku: { in: skus } },
    select: { id: true, sku: true },
  });
  const existingSkus = new Set(existing.map((medicine) => medicine.sku));
  const missing = medicineData.filter((medicine) => !existingSkus.has(medicine.sku));

  if (missing.length) {
    await prisma.medicine.createMany({
      data: missing.map((medicine) => ({
        id: randomUUID(),
        organizationId: organization.id,
        categoryId: categoryIds.get(medicine.category),
        name: medicine.name,
        genericName: medicine.genericName,
        brand: medicine.brand,
        dosageForm: medicine.dosageForm,
        strength: medicine.strength,
        manufacturer: medicine.manufacturer,
        sku: medicine.sku,
        imageUrl: medicine.imageUrl,
        prescriptionRequired: medicine.prescriptionRequired,
        description: medicine.description,
      })),
    });
  }

  const pharmacyMedicines = await prisma.medicine.findMany({
    where: { organizationId: organization.id, sku: { in: skus } },
    select: { id: true, sku: true },
  });
  const medicineIds = new Map(pharmacyMedicines.map((medicine) => [medicine.sku, medicine.id]));
  const batchNumbers = medicineData.map((medicine) => medicine.batchNumber);
  const existingBatches = await prisma.medicineBatch.findMany({
    where: { organizationId: organization.id, branchId: branch.id, batchNumber: { in: batchNumbers } },
    select: { id: true, batchNumber: true },
  });
  const existingBatchNumbers = new Set(existingBatches.map((batch) => batch.batchNumber));
  const missingBatches = medicineData.filter((medicine) => !existingBatchNumbers.has(medicine.batchNumber));
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 3);

  if (missingBatches.length) {
    await prisma.medicineBatch.createMany({
      data: missingBatches.map((medicine) => ({
        id: randomUUID(),
        organizationId: organization.id,
        branchId: branch.id,
        medicineId: medicineIds.get(medicine.sku),
        batchNumber: medicine.batchNumber,
        purchasePrice: medicine.purchasePrice,
        sellingPrice: medicine.sellingPrice,
        quantity: medicine.quantity,
        minStock: 10,
        expiryDate: expiresAt,
      })),
    });
  }

  const pharmacyBatches = await prisma.medicineBatch.findMany({
    where: { organizationId: organization.id, branchId: branch.id, batchNumber: { in: batchNumbers } },
    select: { id: true, batchNumber: true, medicineId: true, quantity: true },
  });
  const batchByNumber = new Map(pharmacyBatches.map((batch) => [batch.batchNumber, batch]));
  const batchIds = pharmacyBatches.map((batch) => batch.id);
  const existingTransactions = await prisma.inventoryTransaction.findMany({
    where: { organizationId: organization.id, branchId: branch.id, type: 'PURCHASE', referenceId: { in: batchIds } },
    select: { referenceId: true },
  });
  const transactionBatchIds = new Set(existingTransactions.map((transaction) => transaction.referenceId));
  const missingTransactions = medicineData
    .map((medicine) => batchByNumber.get(medicine.batchNumber))
    .filter((batch) => batch && !transactionBatchIds.has(batch.id));

  if (missingTransactions.length) {
    await prisma.inventoryTransaction.createMany({
      data: missingTransactions.map((batch) => ({
        organizationId: organization.id,
        branchId: branch.id,
        medicineId: batch.medicineId,
        batchId: batch.id,
        type: 'PURCHASE',
        quantity: batch.quantity,
        referenceId: batch.id,
        notes: 'Initial stock for PharmaPulse demo catalog',
      })),
    });
  }

  console.log(JSON.stringify({
    organization: organization.name,
    branch: branch.name,
    totalDemoMedicines: medicineData.length,
    newlyCreated: missing.length,
    alreadyPresent: existing.length,
    newStockBatches: missingBatches.length,
  }));
}

main()
  .catch((error) => {
    console.error('Failed to seed pharmacy1 demo medicines:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
