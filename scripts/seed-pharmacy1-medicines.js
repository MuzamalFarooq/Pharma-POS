import { randomUUID } from 'node:crypto';
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const organizationSlug = 'pharmacy1-1259';
const branchCode = 'MAIN';
const lahorePharmacies = [
  { name: 'Lahore Care Pharmacy', slug: 'lahore-care-pharmacy-demo', code: 'LHRCARE01', email: 'lahore-care@pharmacy-demo.example', phone: '+92-300-0000001', address: 'Main Boulevard, Gulberg III' },
  { name: 'Gulberg Health Pharmacy', slug: 'gulberg-health-pharmacy-demo', code: 'LHRCARE02', email: 'gulberg-health@pharmacy-demo.example', phone: '+92-300-0000002', address: 'MM Alam Road, Gulberg III' },
  { name: 'Johar Town Medicos', slug: 'johar-town-medicos-demo', code: 'LHRCARE03', email: 'johar-town@pharmacy-demo.example', phone: '+92-300-0000003', address: 'College Road, Johar Town' },
  { name: 'Model Town Pharmacy', slug: 'model-town-pharmacy-demo', code: 'LHRCARE04', email: 'model-town@pharmacy-demo.example', phone: '+92-300-0000004', address: 'Link Road, Model Town' },
  { name: 'DHA Lahore Pharmacy', slug: 'dha-lahore-pharmacy-demo', code: 'LHRCARE05', email: 'dha-lahore@pharmacy-demo.example', phone: '+92-300-0000005', address: 'Commercial Area, DHA Phase 5' },
];
const categories = [
  'Over-the-Counter Medicine',
  'Prescribed Medicine',
  'Skin & Hair Care',
  'Pain Relief',
  'Allergy Care',
  'Digestive Health',
  'Cardiovascular',
  'Diabetes Care',
  'Vitamins & Supplements',
  "Women's Health",
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

const sectionProducts = [
  {
    section: 'over-the-counter',
    category: 'Over-the-Counter Medicine',
    products: [
      { genericName: 'Acetaminophen', label: 'Acetaminophen', form: 'Tablet', strengths: ['325mg', '500mg', '650mg', '750mg', '1000mg'], image: 'tablets.svg' },
      { genericName: 'Ibuprofen', label: 'Ibuprofen', form: 'Tablet', strengths: ['100mg', '200mg', '300mg', '400mg', '600mg'], image: 'tablets.svg' },
      { genericName: 'Aspirin', label: 'Aspirin', form: 'Tablet', strengths: ['81mg', '162mg', '243mg', '325mg', '500mg'], image: 'tablets.svg' },
      { genericName: 'Cetirizine', label: 'Cetirizine', form: 'Tablet', strengths: ['2.5mg', '5mg', '7.5mg', '10mg', '20mg'], image: 'tablets.svg' },
      { genericName: 'Loratadine', label: 'Loratadine', form: 'Tablet', strengths: ['2.5mg', '5mg', '7.5mg', '10mg', '20mg'], image: 'tablets.svg' },
      { genericName: 'Famotidine', label: 'Famotidine', form: 'Tablet', strengths: ['10mg', '20mg', '30mg', '40mg', '80mg'], image: 'tablets.svg' },
      { genericName: 'Calcium carbonate', label: 'Calcium Carbonate', form: 'Chewable tablet', strengths: ['500mg', '600mg', '750mg', '1000mg', '1250mg'], image: 'tablets.svg' },
      { genericName: 'Dextromethorphan', label: 'Dextromethorphan', form: 'Syrup', strengths: ['5mg/5mL', '10mg/5mL', '15mg/5mL', '20mg/5mL', '30mg/5mL'], image: 'liquid.svg' },
      { genericName: 'Guaifenesin', label: 'Guaifenesin', form: 'Syrup', strengths: ['100mg/5mL', '200mg/5mL', '300mg/5mL', '400mg/5mL', '600mg/5mL'], image: 'liquid.svg' },
      { genericName: 'Loperamide', label: 'Loperamide', form: 'Capsule', strengths: ['1mg', '2mg', '3mg', '4mg', '6mg'], image: 'capsules.svg' },
    ],
  },
  {
    section: 'prescribed',
    category: 'Prescribed Medicine',
    products: [
      { genericName: 'Amoxicillin', label: 'Amoxicillin', form: 'Capsule', strengths: ['250mg', '500mg', '750mg', '875mg', '1000mg'], prescriptionRequired: true, image: 'capsules.svg' },
      { genericName: 'Doxycycline', label: 'Doxycycline', form: 'Capsule', strengths: ['20mg', '50mg', '75mg', '100mg', '150mg'], prescriptionRequired: true, image: 'capsules.svg' },
      { genericName: 'Metformin', label: 'Metformin', form: 'Tablet', strengths: ['250mg', '500mg', '750mg', '850mg', '1000mg'], prescriptionRequired: true, image: 'tablets.svg' },
      { genericName: 'Amlodipine', label: 'Amlodipine', form: 'Tablet', strengths: ['2.5mg', '5mg', '7.5mg', '10mg', '15mg'], prescriptionRequired: true, image: 'tablets.svg' },
      { genericName: 'Losartan', label: 'Losartan', form: 'Tablet', strengths: ['25mg', '50mg', '75mg', '100mg', '150mg'], prescriptionRequired: true, image: 'tablets.svg' },
      { genericName: 'Atorvastatin', label: 'Atorvastatin', form: 'Tablet', strengths: ['5mg', '10mg', '20mg', '40mg', '80mg'], prescriptionRequired: true, image: 'tablets.svg' },
      { genericName: 'Lisinopril', label: 'Lisinopril', form: 'Tablet', strengths: ['2.5mg', '5mg', '10mg', '20mg', '40mg'], prescriptionRequired: true, image: 'tablets.svg' },
      { genericName: 'Levothyroxine', label: 'Levothyroxine', form: 'Tablet', strengths: ['25mcg', '50mcg', '75mcg', '100mcg', '150mcg'], prescriptionRequired: true, image: 'tablets.svg' },
      { genericName: 'Sertraline', label: 'Sertraline', form: 'Tablet', strengths: ['25mg', '50mg', '75mg', '100mg', '200mg'], prescriptionRequired: true, image: 'tablets.svg' },
      { genericName: 'Nitrofurantoin', label: 'Nitrofurantoin', form: 'Capsule', strengths: ['25mg', '50mg', '75mg', '100mg', '150mg'], prescriptionRequired: true, image: 'capsules.svg' },
    ],
  },
  {
    section: 'skin-hair',
    category: 'Skin & Hair Care',
    products: [
      { genericName: 'Hydrocortisone', label: 'Hydrocortisone Cream', form: 'Cream', strengths: ['0.5%', '1%', '1.5%', '2%', '2.5%'], image: 'topical.svg' },
      { genericName: 'Clotrimazole', label: 'Clotrimazole Cream', form: 'Cream', strengths: ['0.5%', '1%', '1.5%', '2%', '3%'], image: 'topical.svg' },
      { genericName: 'Miconazole', label: 'Miconazole Cream', form: 'Cream', strengths: ['0.5%', '1%', '1.5%', '2%', '4%'], image: 'topical.svg' },
      { genericName: 'Terbinafine', label: 'Terbinafine Cream', form: 'Cream', strengths: ['0.5%', '1%', '1.5%', '2%', '2.5%'], image: 'topical.svg' },
      { genericName: 'Benzoyl peroxide', label: 'Benzoyl Peroxide Gel', form: 'Gel', strengths: ['2.5%', '3%', '4%', '5%', '10%'], image: 'topical.svg' },
      { genericName: 'Salicylic acid', label: 'Salicylic Acid Treatment', form: 'Topical solution', strengths: ['0.5%', '1%', '2%', '3%', '6%'], image: 'topical.svg' },
      { genericName: 'Minoxidil', label: 'Minoxidil Topical', form: 'Topical solution', strengths: ['1%', '2%', '3%', '5%', '6%'], image: 'topical.svg' },
      { genericName: 'Ketoconazole', label: 'Ketoconazole Shampoo', form: 'Shampoo', strengths: ['0.5%', '1%', '1.5%', '2%', '2.5%'], image: 'topical.svg' },
      { genericName: 'Zinc oxide', label: 'Zinc Oxide Ointment', form: 'Ointment', strengths: ['5%', '10%', '15%', '20%', '25%'], image: 'topical.svg' },
      { genericName: 'Calamine', label: 'Calamine Lotion', form: 'Lotion', strengths: ['5%', '8%', '10%', '12%', '15%'], image: 'topical.svg' },
    ],
  },
  {
    section: 'vitamins-supplements',
    category: 'Vitamins & Supplements',
    products: [
      { genericName: 'Ascorbic acid', label: 'Vitamin C', form: 'Tablet', strengths: ['100mg', '250mg', '500mg', '750mg', '1000mg'], image: 'vitamins.svg' },
      { genericName: 'Cholecalciferol', label: 'Vitamin D3', form: 'Softgel', strengths: ['400IU', '800IU', '1000IU', '2000IU', '5000IU'], image: 'vitamins.svg' },
      { genericName: 'Cyanocobalamin', label: 'Vitamin B12', form: 'Tablet', strengths: ['250mcg', '500mcg', '1000mcg', '1500mcg', '2500mcg'], image: 'vitamins.svg' },
      { genericName: 'Folic acid', label: 'Folic Acid', form: 'Tablet', strengths: ['400mcg', '600mcg', '800mcg', '1mg', '5mg'], image: 'vitamins.svg' },
      { genericName: 'Ferrous sulfate', label: 'Ferrous Sulfate', form: 'Tablet', strengths: ['18mg', '65mg', '130mg', '195mg', '325mg'], image: 'vitamins.svg' },
      { genericName: 'Zinc sulfate', label: 'Zinc', form: 'Tablet', strengths: ['5mg', '10mg', '15mg', '25mg', '50mg'], image: 'vitamins.svg' },
      { genericName: 'Magnesium citrate', label: 'Magnesium Citrate', form: 'Capsule', strengths: ['100mg', '150mg', '200mg', '300mg', '400mg'], image: 'vitamins.svg' },
      { genericName: 'Calcium carbonate', label: 'Calcium Supplement', form: 'Tablet', strengths: ['250mg', '500mg', '600mg', '750mg', '1000mg'], image: 'vitamins.svg' },
      { genericName: 'Omega-3 fatty acids', label: 'Omega-3 Fish Oil', form: 'Softgel', strengths: ['300mg', '500mg', '600mg', '1000mg', '1200mg'], image: 'vitamins.svg' },
      { genericName: 'Multivitamin', label: 'Daily Multivitamin', form: 'Tablet', strengths: ['Adult', 'Women', 'Men', '50+', 'Complete'], image: 'vitamins.svg' },
    ],
  },
  {
    section: 'women-health',
    category: "Women's Health",
    products: [
      { genericName: 'Prenatal multivitamin', label: 'Prenatal Multivitamin', form: 'Tablet', strengths: ['Basic', 'With DHA', 'With iron', 'Once daily', 'Complete'], image: 'vitamins.svg' },
      { genericName: 'Folic acid', label: 'Women’s Folic Acid', form: 'Tablet', strengths: ['400mcg', '600mcg', '800mcg', '1mg', '5mg'], image: 'vitamins.svg' },
      { genericName: 'Ferrous sulfate', label: 'Women’s Iron Supplement', form: 'Tablet', strengths: ['18mg', '28mg', '65mg', '130mg', '325mg'], image: 'vitamins.svg' },
      { genericName: 'Calcium carbonate', label: 'Women’s Calcium Supplement', form: 'Tablet', strengths: ['250mg', '500mg', '600mg', '750mg', '1000mg'], image: 'vitamins.svg' },
      { genericName: 'Cholecalciferol', label: 'Women’s Vitamin D3', form: 'Softgel', strengths: ['400IU', '800IU', '1000IU', '2000IU', '5000IU'], image: 'vitamins.svg' },
      { genericName: 'Clotrimazole', label: 'Clotrimazole Vaginal Cream', form: 'Vaginal cream', strengths: ['1%', '2%', '3%', '4%', '7%'], image: 'topical.svg' },
      { genericName: 'Miconazole', label: 'Miconazole Vaginal Cream', form: 'Vaginal cream', strengths: ['2%', '3%', '4%', '5%', '7%'], image: 'topical.svg' },
      { genericName: 'Ibuprofen', label: 'Women’s Ibuprofen', form: 'Tablet', strengths: ['200mg', '300mg', '400mg', '600mg', '800mg'], image: 'tablets.svg' },
      { genericName: 'Levonorgestrel', label: 'Levonorgestrel', form: 'Tablet', strengths: ['0.75mg', '1.5mg', '2mg', '3mg', '4mg'], prescriptionRequired: true, image: 'tablets.svg' },
      { genericName: 'Estradiol', label: 'Estradiol', form: 'Tablet', strengths: ['0.5mg', '1mg', '1.5mg', '2mg', '4mg'], prescriptionRequired: true, image: 'tablets.svg' },
    ],
  },
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

const sectionMedicineData = sectionProducts.flatMap((section, sectionIndex) =>
  section.products.flatMap((product, productIndex) =>
    product.strengths.map((strength, strengthIndex) => {
      const sectionNumber = productIndex * product.strengths.length + strengthIndex + 1;
      const number = sectionIndex * 50 + sectionNumber;
      const code = String(sectionNumber).padStart(3, '0');
      return {
        sku: `PP-SECTION-${section.section.toUpperCase()}-${code}`,
        category: section.category,
        name: `${product.label} ${strength}`,
        genericName: product.genericName,
        brand: ['DailyCare', 'WellSpring', 'Northstar Health', 'Evergreen'][number % 4],
        dosageForm: product.form,
        strength,
        manufacturer: 'Demo Pharmaceutical Co.',
        imageUrl: imageFor(product.image),
        prescriptionRequired: Boolean(product.prescriptionRequired),
        description: `Demonstration catalog item for ${section.category.toLowerCase()}.`,
        quantity: 20 + ((number * 37) % 81),
        sellingPrice: Number((3.5 + ((number * 173) % 2400) / 100).toFixed(2)),
        purchasePrice: Number((1.25 + ((number * 97) % 1100) / 100).toFixed(2)),
        batchNumber: `SECTION-${section.section.toUpperCase()}-2026-${code}`,
      };
    })
  )
);

const allMedicineData = [...medicineData, ...sectionMedicineData];
const medicineCountsBySection = Object.fromEntries(
  sectionProducts.map((section) => [
    section.section,
    sectionMedicineData.filter((medicine) => medicine.category === section.category).length,
  ])
);

if (medicineData.length !== 100 || Object.values(medicineCountsBySection).some((count) => count !== 50)) {
  throw new Error(`Expected 100 general medicines and 50 medicines per section; got ${JSON.stringify(medicineCountsBySection)}.`);
}

async function seedCatalogForBranch(organization, branch) {
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
  const skus = allMedicineData.map((medicine) => medicine.sku);
  const existing = await prisma.medicine.findMany({
    where: { organizationId: organization.id, sku: { in: skus } },
    select: { id: true, sku: true },
  });
  const existingSkus = new Set(existing.map((medicine) => medicine.sku));
  const missing = allMedicineData.filter((medicine) => !existingSkus.has(medicine.sku));

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
  const batchNumbers = allMedicineData.map((medicine) => medicine.batchNumber);
  const existingBatches = await prisma.medicineBatch.findMany({
    where: { organizationId: organization.id, branchId: branch.id, batchNumber: { in: batchNumbers } },
    select: { id: true, batchNumber: true },
  });
  const existingBatchNumbers = new Set(existingBatches.map((batch) => batch.batchNumber));
  const missingBatches = allMedicineData.filter((medicine) => !existingBatchNumbers.has(medicine.batchNumber));
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
  const missingTransactions = allMedicineData
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
    totalDemoMedicines: allMedicineData.length,
    medicinesBySection: medicineCountsBySection,
    newlyCreated: missing.length,
    alreadyPresent: existing.length,
    newStockBatches: missingBatches.length,
  }));
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const seedLahorePharmacies = process.argv.includes('--lahore-pharmacies');
  const organizationArgument = process.argv.find((argument) => argument.startsWith('--organization='));
  const requestedOrganizationSlug = organizationArgument?.slice('--organization='.length);
  const uniqueSkus = new Set(allMedicineData.map((medicine) => medicine.sku));

  if (uniqueSkus.size !== allMedicineData.length) {
    throw new Error(`Generated duplicate medicine SKUs: expected ${allMedicineData.length}, got ${uniqueSkus.size}.`);
  }
  if (seedLahorePharmacies && requestedOrganizationSlug) {
    throw new Error('Use either --lahore-pharmacies or --organization=<slug>, not both.');
  }
  if (requestedOrganizationSlug !== undefined && !requestedOrganizationSlug) {
    throw new Error('--organization must include an organization slug.');
  }

  if (dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      target: seedLahorePharmacies ? 'five Lahore pharmacies' : requestedOrganizationSlug || organizationSlug,
      totalDemoMedicinesPerPharmacy: allMedicineData.length,
      uniqueSkus: uniqueSkus.size,
      medicinesBySection: medicineCountsBySection,
      categories: [...new Set(allMedicineData.map((medicine) => medicine.category))].length,
    }));
    return;
  }

  if (seedLahorePharmacies) {
    for (const pharmacy of lahorePharmacies) {
      let organization = await prisma.organization.findUnique({
        where: { slug: pharmacy.slug },
        select: { id: true, name: true },
      });
      if (!organization) {
        organization = await prisma.organization.create({
          data: {
            name: pharmacy.name,
            slug: pharmacy.slug,
            code: pharmacy.code,
            email: pharmacy.email,
            phone: pharmacy.phone,
            address: pharmacy.address,
            city: 'Lahore',
            state: 'Punjab',
            country: 'Pakistan',
            currency: 'PKR',
          },
          select: { id: true, name: true },
        });
      }

      let branch = await prisma.branch.findFirst({
        where: { organizationId: organization.id, code: branchCode },
        select: { id: true, name: true, status: true },
      });
      if (!branch) {
        branch = await prisma.branch.create({
          data: {
            organizationId: organization.id,
            name: `${pharmacy.name} - Main Branch`,
            code: branchCode,
            phone: pharmacy.phone,
            address: pharmacy.address,
            city: 'Lahore',
            status: 'ACTIVE',
            isMain: true,
          },
          select: { id: true, name: true, status: true },
        });
      }
      if (branch.status !== 'ACTIVE') {
        throw new Error(`Branch ${branch.name} for ${organization.name} is inactive.`);
      }

      await seedCatalogForBranch(organization, branch);
    }
    return;
  }

  const slug = requestedOrganizationSlug || organizationSlug;
  const organization = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!organization) throw new Error(`Pharmacy "${slug}" was not found.`);

  const branch = await prisma.branch.findFirst({
    where: { organizationId: organization.id, code: branchCode, status: 'ACTIVE' },
    select: { id: true, name: true },
  });
  if (!branch) throw new Error(`Active ${branchCode} branch not found for pharmacy "${organization.name}".`);
  await seedCatalogForBranch(organization, branch);
}

main()
  .catch((error) => {
    console.error('Failed to seed pharmacy1 demo medicines:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
