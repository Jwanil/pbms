const locationService = require('../services/locationService');
const { sendSuccess, sendError } = require('../utils/response');
const { z } = require('zod');

const countrySchema = z.object({
  country_name: z.string().min(1, 'Country name is required').max(100).trim(),
  country_code: z.string().max(3).optional().nullable().or(z.literal('')),
});

const stateSchema = z.object({
  state_name: z.string().min(1, 'State name is required').max(100).trim(),
  country_id: z.number().int().positive('Country is required'),
});

const citySchema = z.object({
  city_name: z.string().min(1, 'City name is required').max(100).trim(),
  state_id: z.number().int().positive('State is required'),
});

// ─── COUNTRIES ───────────────────────────────────────────────────────────────

const getCountriesController = async (req, res, next) => {
  try {
    const { search = '', include_inactive } = req.query;
    const data = await locationService.getCountries({ search, includeInactive: include_inactive === 'true' });
    return sendSuccess(res, data, 'Countries fetched');
  } catch (err) { next(err); }
};

const createCountryController = async (req, res, next) => {
  try {
    const parsed = countrySchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const data = await locationService.createCountry(parsed.data);
    return sendSuccess(res, data, 'Country created', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const updateCountryController = async (req, res, next) => {
  try {
    const parsed = countrySchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const data = await locationService.updateCountry(parseInt(req.params.id), parsed.data);
    return sendSuccess(res, data, 'Country updated');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const deactivateCountryController = async (req, res, next) => {
  try {
    await locationService.deactivateCountry(parseInt(req.params.id));
    return sendSuccess(res, null, 'Country deactivated (states and cities also deactivated)');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const reactivateCountryController = async (req, res, next) => {
  try {
    await locationService.reactivateCountry(parseInt(req.params.id));
    return sendSuccess(res, null, 'Country reactivated');
  } catch (err) { next(err); }
};

// ─── STATES ──────────────────────────────────────────────────────────────────

const getStatesController = async (req, res, next) => {
  try {
    const { country_id, search = '', include_inactive } = req.query;
    const data = await locationService.getStates({ country_id, search, includeInactive: include_inactive === 'true' });
    return sendSuccess(res, data, 'States fetched');
  } catch (err) { next(err); }
};

const createStateController = async (req, res, next) => {
  try {
    const parsed = stateSchema.safeParse({ ...req.body, country_id: Number(req.body.country_id) });
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const data = await locationService.createState(parsed.data);
    return sendSuccess(res, data, 'State created', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const updateStateController = async (req, res, next) => {
  try {
    const parsed = stateSchema.safeParse({ ...req.body, country_id: Number(req.body.country_id) });
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const data = await locationService.updateState(parseInt(req.params.id), parsed.data);
    return sendSuccess(res, data, 'State updated');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const deactivateStateController = async (req, res, next) => {
  try {
    await locationService.deactivateState(parseInt(req.params.id));
    return sendSuccess(res, null, 'State deactivated (cities also deactivated)');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const reactivateStateController = async (req, res, next) => {
  try {
    await locationService.reactivateState(parseInt(req.params.id));
    return sendSuccess(res, null, 'State reactivated');
  } catch (err) { next(err); }
};

// ─── CITIES ──────────────────────────────────────────────────────────────────

const getCitiesController = async (req, res, next) => {
  try {
    const { state_id, search = '', include_inactive } = req.query;
    const data = await locationService.getCities({ state_id, search, includeInactive: include_inactive === 'true' });
    return sendSuccess(res, data, 'Cities fetched');
  } catch (err) { next(err); }
};

const createCityController = async (req, res, next) => {
  try {
    const parsed = citySchema.safeParse({ ...req.body, state_id: Number(req.body.state_id) });
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const data = await locationService.createCity(parsed.data);
    return sendSuccess(res, data, 'City created', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const updateCityController = async (req, res, next) => {
  try {
    const parsed = citySchema.safeParse({ ...req.body, state_id: Number(req.body.state_id) });
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const data = await locationService.updateCity(parseInt(req.params.id), parsed.data);
    return sendSuccess(res, data, 'City updated');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const deactivateCityController = async (req, res, next) => {
  try {
    await locationService.deactivateCity(parseInt(req.params.id));
    return sendSuccess(res, null, 'City deactivated');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const reactivateCityController = async (req, res, next) => {
  try {
    await locationService.reactivateCity(parseInt(req.params.id));
    return sendSuccess(res, null, 'City reactivated');
  } catch (err) { next(err); }
};

module.exports = {
  getCountriesController, createCountryController, updateCountryController, deactivateCountryController, reactivateCountryController,
  getStatesController, createStateController, updateStateController, deactivateStateController, reactivateStateController,
  getCitiesController, createCityController, updateCityController, deactivateCityController, reactivateCityController,
};
