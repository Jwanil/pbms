const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── COUNTRIES ───────────────────────────────────────────────────────────────

const getCountries = async ({ search = '', includeInactive = false } = {}) => {
  const where = {
    ...(includeInactive ? {} : { is_active: true }),
    ...(search ? { country_name: { contains: search } } : {}),
  };
  return prisma.country.findMany({
    where,
    orderBy: { country_name: 'asc' },
    select: { country_id: true, country_name: true, country_code: true, is_active: true, _count: { select: { states: true } } },
  });
};

const getCountryById = async (id) => {
  const country = await prisma.country.findUnique({
    where: { country_id: id },
    select: { country_id: true, country_name: true, country_code: true, is_active: true },
  });
  if (!country) throw { statusCode: 404, message: 'Country not found', code: 'NOT_FOUND' };
  return country;
};

const createCountry = async (data) => {
  try {
    return await prisma.country.create({
      data: { country_name: data.country_name, country_code: data.country_code || null },
    });
  } catch (e) {
    if (e.code === 'P2002') throw { statusCode: 409, message: 'Country name already exists', code: 'DUPLICATE' };
    throw e;
  }
};

const updateCountry = async (id, data) => {
  await getCountryById(id);
  try {
    return await prisma.country.update({
      where: { country_id: id },
      data: { country_name: data.country_name, country_code: data.country_code || null },
    });
  } catch (e) {
    if (e.code === 'P2002') throw { statusCode: 409, message: 'Country name already exists', code: 'DUPLICATE' };
    throw e;
  }
};

const deactivateCountry = async (id) => {
  await getCountryById(id);
  // Cascade deactivate states and cities
  const states = await prisma.state.findMany({ where: { country_id: id }, select: { state_id: true } });
  const stateIds = states.map(s => s.state_id);
  await prisma.$transaction([
    prisma.city.updateMany({ where: { state_id: { in: stateIds } }, data: { is_active: false } }),
    prisma.state.updateMany({ where: { country_id: id }, data: { is_active: false } }),
    prisma.country.update({ where: { country_id: id }, data: { is_active: false } }),
  ]);
};

const reactivateCountry = async (id) => {
  await prisma.country.update({ where: { country_id: id }, data: { is_active: true } });
};

// ─── STATES ──────────────────────────────────────────────────────────────────

const getStates = async ({ country_id, search = '', includeInactive = false } = {}) => {
  const where = {
    ...(includeInactive ? {} : { is_active: true }),
    ...(country_id ? { country_id: parseInt(country_id) } : {}),
    ...(search ? { state_name: { contains: search } } : {}),
  };
  return prisma.state.findMany({
    where,
    orderBy: { state_name: 'asc' },
    select: {
      state_id: true, state_name: true, is_active: true,
      country: { select: { country_id: true, country_name: true } },
      _count: { select: { cities: true } },
    },
  });
};

const getStateById = async (id) => {
  const state = await prisma.state.findUnique({
    where: { state_id: id },
    select: { state_id: true, state_name: true, country_id: true, is_active: true },
  });
  if (!state) throw { statusCode: 404, message: 'State not found', code: 'NOT_FOUND' };
  return state;
};

const createState = async (data) => {
  try {
    return await prisma.state.create({
      data: { state_name: data.state_name, country_id: parseInt(data.country_id) },
    });
  } catch (e) {
    if (e.code === 'P2002') throw { statusCode: 409, message: 'State already exists in this country', code: 'DUPLICATE' };
    throw e;
  }
};

const updateState = async (id, data) => {
  await getStateById(id);
  try {
    return await prisma.state.update({
      where: { state_id: id },
      data: { state_name: data.state_name, country_id: parseInt(data.country_id) },
    });
  } catch (e) {
    if (e.code === 'P2002') throw { statusCode: 409, message: 'State already exists in this country', code: 'DUPLICATE' };
    throw e;
  }
};

const deactivateState = async (id) => {
  await getStateById(id);
  await prisma.$transaction([
    prisma.city.updateMany({ where: { state_id: id }, data: { is_active: false } }),
    prisma.state.update({ where: { state_id: id }, data: { is_active: false } }),
  ]);
};

const reactivateState = async (id) => {
  await prisma.state.update({ where: { state_id: id }, data: { is_active: true } });
};

// ─── CITIES ──────────────────────────────────────────────────────────────────

const getCities = async ({ state_id, search = '', includeInactive = false } = {}) => {
  const where = {
    ...(includeInactive ? {} : { is_active: true }),
    ...(state_id ? { state_id: parseInt(state_id) } : {}),
    ...(search ? { city_name: { contains: search } } : {}),
  };
  return prisma.city.findMany({
    where,
    orderBy: { city_name: 'asc' },
    select: {
      city_id: true, city_name: true, is_active: true,
      state: { select: { state_id: true, state_name: true, country: { select: { country_id: true, country_name: true } } } },
    },
  });
};

const getCityById = async (id) => {
  const city = await prisma.city.findUnique({
    where: { city_id: id },
    select: { city_id: true, city_name: true, state_id: true, is_active: true },
  });
  if (!city) throw { statusCode: 404, message: 'City not found', code: 'NOT_FOUND' };
  return city;
};

const createCity = async (data) => {
  try {
    return await prisma.city.create({
      data: { city_name: data.city_name, state_id: parseInt(data.state_id) },
    });
  } catch (e) {
    if (e.code === 'P2002') throw { statusCode: 409, message: 'City already exists in this state', code: 'DUPLICATE' };
    throw e;
  }
};

const updateCity = async (id, data) => {
  await getCityById(id);
  try {
    return await prisma.city.update({
      where: { city_id: id },
      data: { city_name: data.city_name, state_id: parseInt(data.state_id) },
    });
  } catch (e) {
    if (e.code === 'P2002') throw { statusCode: 409, message: 'City already exists in this state', code: 'DUPLICATE' };
    throw e;
  }
};

const deactivateCity = async (id) => {
  await getCityById(id);
  await prisma.city.update({ where: { city_id: id }, data: { is_active: false } });
};

const reactivateCity = async (id) => {
  await prisma.city.update({ where: { city_id: id }, data: { is_active: true } });
};

module.exports = {
  getCountries, getCountryById, createCountry, updateCountry, deactivateCountry, reactivateCountry,
  getStates, getStateById, createState, updateState, deactivateState, reactivateState,
  getCities, getCityById, createCity, updateCity, deactivateCity, reactivateCity,
};
