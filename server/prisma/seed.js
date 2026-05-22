const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── 1. Roles ──────────────────────────────────────────
  const superAdminRole = await prisma.role.upsert({
    where: { role_name: 'SUPER_ADMIN' },
    update: {},
    create: { role_name: 'SUPER_ADMIN', description: 'Full system access' }
  });

  const adminRole = await prisma.role.upsert({
    where: { role_name: 'ADMIN' },
    update: {},
    create: { role_name: 'ADMIN', description: 'Operations management access' }
  });

  const staffRole = await prisma.role.upsert({
    where: { role_name: 'STAFF' },
    update: {},
    create: { role_name: 'STAFF', description: 'Limited read/write access' }
  });

  // ── 2. Permissions Matrix ─────────────────────────────
  const modules = [
    'products', 'companies', 'company_product_mapping',
    'contacts', 'packaging', 'categories', 'departments',
    'grades', 'users', 'roles', 'dashboard'
  ];

  for (const module of modules) {
    const isRestricted = ['users', 'roles'].includes(module);

    await prisma.permission.upsert({
      where: { role_id_module_name: { role_id: superAdminRole.role_id, module_name: module } },
      update: {},
      create: { role_id: superAdminRole.role_id, module_name: module, can_view: true, can_create: true, can_edit: true, can_delete: true }
    });

    await prisma.permission.upsert({
      where: { role_id_module_name: { role_id: adminRole.role_id, module_name: module } },
      update: {},
      create: { role_id: adminRole.role_id, module_name: module, can_view: !isRestricted, can_create: !isRestricted, can_edit: !isRestricted, can_delete: false }
    });

    await prisma.permission.upsert({
      where: { role_id_module_name: { role_id: staffRole.role_id, module_name: module } },
      update: {},
      create: { role_id: staffRole.role_id, module_name: module, can_view: !isRestricted, can_create: false, can_edit: false, can_delete: false }
    });
  }

  // ── 3. Departments ────────────────────────────────────
  const departments = ['Administration', 'Sales', 'Procurement', 'Logistics', 'Finance'];
  for (const name of departments) {
    await prisma.department.upsert({ where: { department_name: name }, update: {}, create: { department_name: name } });
  }

  // ── 4. Categories ─────────────────────────────────────
  const categories = ['Solvents', 'Polymers', 'Acids', 'Alkalis', 'Intermediates', 'Specialty Chemicals', 'Agrochemicals', 'Surfactants'];
  for (const name of categories) {
    await prisma.category.upsert({ where: { category_name: name }, update: {}, create: { category_name: name } });
  }

  // ── 5. Grades ─────────────────────────────────────────
  const grades = ['Industrial', 'Pharma', 'Food', 'Technical', 'Reagent', 'Laboratory'];
  for (const name of grades) {
    await prisma.grade.upsert({ where: { grade_name: name }, update: {}, create: { grade_name: name } });
  }

  // ── 6. Packaging ──────────────────────────────────────
  const packagingTypes = [
    { packaging_name: 'HDPE Drum', size_unit: 'Kg', size_value: 200 },
    { packaging_name: 'IBC Tank', size_unit: 'Litre', size_value: 1000 },
    { packaging_name: 'PP Bag', size_unit: 'Kg', size_value: 50 },
    { packaging_name: 'Carboy', size_unit: 'Litre', size_value: 35 },
    { packaging_name: 'Flexi Bag', size_unit: 'Kg', size_value: 1000 },
    { packaging_name: 'Glass Bottle', size_unit: 'Litre', size_value: 2.5 },
  ];
  for (const pkg of packagingTypes) {
    await prisma.packaging.upsert({ where: { packaging_name: pkg.packaging_name }, update: {}, create: pkg });
  }

  // ── 7. Default Super Admin User ───────────────────────
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  const adminDept = await prisma.department.findFirst({ where: { department_name: 'Administration' } });

  await prisma.user.upsert({
    where: { email: 'admin@pbms.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@pbms.com',
      username: 'superadmin',
      password_hash: hashedPassword,
      mobile: null,
      role_id: superAdminRole.role_id,
      department_id: adminDept ? adminDept.department_id : null,
      status: 'ACTIVE'
    }
  });

  console.log('');
  console.log('Seeding complete.');
  console.log('Default Super Admin credentials:');
  console.log('  Email:    admin@pbms.com');
  console.log('  Password: Admin@123');
  console.log('  Change this password immediately after first login.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
