const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const MODULES = [
  'products', 'companies', 'mappings',
  'contacts', 'packaging', 'categories', 'departments',
  'grades', 'users', 'roles', 'dashboard',
  'locations_countries', 'locations_states', 'locations_cities',
];

const ROLE_DEFAULTS = {
  SUPER_ADMIN: { can_view: true, can_create: true, can_edit: true, can_delete: true },
  ADMIN:       { can_view: true, can_create: true, can_edit: true, can_delete: false },
  STAFF:       { can_view: true, can_create: false, can_edit: false, can_delete: false },
};

// Modules only accessible to SUPER_ADMIN by default
const SUPER_ADMIN_ONLY = ['users', 'roles', 'locations_countries', 'locations_states', 'locations_cities'];

async function seedPermissionsForUser(userId, roleName) {
  const defaults = ROLE_DEFAULTS[roleName] || ROLE_DEFAULTS.STAFF;
  for (const mod of MODULES) {
    const isRestricted = SUPER_ADMIN_ONLY.includes(mod);
    await prisma.permission.upsert({
      where: { user_id_module_name: { user_id: userId, module_name: mod } },
      update: {},
      create: {
        user_id: userId, module_name: mod,
        can_view:   isRestricted ? (roleName === 'SUPER_ADMIN') : defaults.can_view,
        can_create: isRestricted ? (roleName === 'SUPER_ADMIN') : defaults.can_create,
        can_edit:   isRestricted ? (roleName === 'SUPER_ADMIN') : defaults.can_edit,
        can_delete: isRestricted ? (roleName === 'SUPER_ADMIN') : defaults.can_delete,
      }
    });
  }
}

// --- Location default data ---
const LOCATION_DATA = {
  countries: [
    { country_name: 'India',         country_code: 'IND' },
    { country_name: 'United States', country_code: 'USA' },
    { country_name: 'United Kingdom',country_code: 'GBR' },
    { country_name: 'UAE',           country_code: 'ARE' },
    { country_name: 'Germany',       country_code: 'DEU' },
    { country_name: 'Singapore',     country_code: 'SGP' },
    { country_name: 'China',         country_code: 'CHN' },
    { country_name: 'Japan',         country_code: 'JPN' },
  ],
  // States mapped to India only by default
  states: [
    'Gujarat', 'Maharashtra', 'Delhi', 'Karnataka',
    'Tamil Nadu', 'Rajasthan', 'Telangana', 'West Bengal', 'Uttar Pradesh',
    'Madhya Pradesh', 'Punjab', 'Haryana', 'Kerala', 'Andhra Pradesh',
  ],
  cities: {
    'Gujarat':        ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', 'Jamnagar', 'Anand'],
    'Maharashtra':    ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Kolhapur', 'Navi Mumbai'],
    'Delhi':          ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Connaught Place'],
    'Karnataka':      ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Davangere'],
    'Tamil Nadu':     ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Tiruppur'],
    'Rajasthan':      ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
    'Telangana':      ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam'],
    'West Bengal':    ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
    'Uttar Pradesh':  ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Noida', 'Ghaziabad', 'Allahabad'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'],
    'Punjab':         ['Ludhiana', 'Amritsar', 'Chandigarh', 'Jalandhar', 'Patiala'],
    'Haryana':        ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal'],
    'Kerala':         ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore'],
  },
};

async function seedLocations() {
  console.log('Seeding location masters...');

  // Seed countries
  for (const c of LOCATION_DATA.countries) {
    await prisma.country.upsert({
      where: { country_name: c.country_name },
      update: {},
      create: c,
    });
  }

  const india = await prisma.country.findUnique({ where: { country_name: 'India' } });
  if (!india) return;

  // Seed Indian states
  for (const stateName of LOCATION_DATA.states) {
    const state = await prisma.state.upsert({
      where: { state_name_country_id: { state_name: stateName, country_id: india.country_id } },
      update: {},
      create: { state_name: stateName, country_id: india.country_id },
    });

    // Seed cities for this state
    const cities = LOCATION_DATA.cities[stateName] || [];
    for (const cityName of cities) {
      await prisma.city.upsert({
        where: { city_name_state_id: { city_name: cityName, state_id: state.state_id } },
        update: {},
        create: { city_name: cityName, state_id: state.state_id },
      });
    }
  }

  const stateCount = LOCATION_DATA.states.length;
  const cityCount = Object.values(LOCATION_DATA.cities).flat().length;
  console.log(`  ✓ ${LOCATION_DATA.countries.length} countries, ${stateCount} states, ${cityCount} cities seeded`);
}

async function main() {
  console.log('Seeding database...');
  const superAdminRole = await prisma.role.upsert({ where: { role_name: 'SUPER_ADMIN' }, update: {}, create: { role_name: 'SUPER_ADMIN', description: 'Full system access' } });
  await prisma.role.upsert({ where: { role_name: 'ADMIN' }, update: {}, create: { role_name: 'ADMIN', description: 'Operations management access' } });
  await prisma.role.upsert({ where: { role_name: 'STAFF' }, update: {}, create: { role_name: 'STAFF', description: 'Limited read/write access' } });

  const departments = ['Administration', 'Sales', 'Procurement', 'Logistics', 'Finance'];
  for (const name of departments) { await prisma.department.upsert({ where: { department_name: name }, update: {}, create: { department_name: name } }); }

  const categories = ['Solvents', 'Polymers', 'Acids', 'Alkalis', 'Intermediates', 'Specialty Chemicals', 'Agrochemicals', 'Surfactants'];
  for (const name of categories) { await prisma.category.upsert({ where: { category_name: name }, update: {}, create: { category_name: name } }); }

  const grades = ['Industrial', 'Pharma', 'Food', 'Technical', 'Reagent', 'Laboratory'];
  for (const name of grades) { await prisma.grade.upsert({ where: { grade_name: name }, update: {}, create: { grade_name: name } }); }

  const packagingTypes = [
    { packaging_name: 'HDPE Drum',   size_unit: 'Kg',     size_value: 200  },
    { packaging_name: 'IBC Tank',    size_unit: 'Litre',  size_value: 1000 },
    { packaging_name: 'PP Bag',      size_unit: 'Kg',     size_value: 50   },
    { packaging_name: 'Carboy',      size_unit: 'Litre',  size_value: 35   },
    { packaging_name: 'Flexi Bag',   size_unit: 'Kg',     size_value: 1000 },
    { packaging_name: 'Glass Bottle',size_unit: 'Litre',  size_value: 2.5  },
  ];
  for (const pkg of packagingTypes) { await prisma.packaging.upsert({ where: { packaging_name: pkg.packaging_name }, update: {}, create: pkg }); }

  await seedLocations();

  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  const adminDept = await prisma.department.findFirst({ where: { department_name: 'Administration' } });
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@pbms.com' }, update: {},
    create: { name: 'Super Admin', email: 'admin@pbms.com', username: 'superadmin', password_hash: hashedPassword, mobile: null, role_id: superAdminRole.role_id, department_id: adminDept ? adminDept.department_id : null, status: 'ACTIVE' }
  });
  await seedPermissionsForUser(superAdmin.user_id, 'SUPER_ADMIN');

  const allUsers = await prisma.user.findMany({ select: { user_id: true, role: { select: { role_name: true } } } });
  for (const u of allUsers) {
    if (u.user_id === superAdmin.user_id) continue;
    await seedPermissionsForUser(u.user_id, u.role.role_name);
  }

  console.log('\nSeeding complete.\nDefault Super Admin credentials:\n  Email:    admin@pbms.com\n  Password: Admin@123\n  Change this password immediately after first login.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
