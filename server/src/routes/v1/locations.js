const { Router } = require('express');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');
const {
  getCountriesController, createCountryController, updateCountryController, deactivateCountryController, reactivateCountryController,
  getStatesController, createStateController, updateStateController, deactivateStateController, reactivateStateController,
  getCitiesController, createCityController, updateCityController, deactivateCityController, reactivateCityController,
} = require('../../controllers/locationController');

const router = Router();

// ─── COUNTRIES ───────────────────────────────────────────────────────────────
// GET is open to all authenticated users so LocationFields can populate dropdowns
router.get('/countries',              verifyToken, getCountriesController);
router.post('/countries',             verifyToken, roleGuard('locations_countries', 'can_create'), createCountryController);
router.put('/countries/:id',          verifyToken, roleGuard('locations_countries', 'can_edit'),   updateCountryController);
router.patch('/countries/:id/deactivate', verifyToken, roleGuard('locations_countries', 'can_delete'), deactivateCountryController);
router.patch('/countries/:id/reactivate', verifyToken, roleGuard('locations_countries', 'can_edit'),   reactivateCountryController);

// ─── STATES ──────────────────────────────────────────────────────────────────
router.get('/states',                 verifyToken, getStatesController);
router.post('/states',                verifyToken, roleGuard('locations_states', 'can_create'), createStateController);
router.put('/states/:id',             verifyToken, roleGuard('locations_states', 'can_edit'),   updateStateController);
router.patch('/states/:id/deactivate',verifyToken, roleGuard('locations_states', 'can_delete'), deactivateStateController);
router.patch('/states/:id/reactivate',verifyToken, roleGuard('locations_states', 'can_edit'),   reactivateStateController);

// ─── CITIES ──────────────────────────────────────────────────────────────────
router.get('/cities',                 verifyToken, getCitiesController);
router.post('/cities',                verifyToken, roleGuard('locations_cities', 'can_create'), createCityController);
router.put('/cities/:id',             verifyToken, roleGuard('locations_cities', 'can_edit'),   updateCityController);
router.patch('/cities/:id/deactivate',verifyToken, roleGuard('locations_cities', 'can_delete'), deactivateCityController);
router.patch('/cities/:id/reactivate',verifyToken, roleGuard('locations_cities', 'can_edit'),   reactivateCityController);

module.exports = router;
