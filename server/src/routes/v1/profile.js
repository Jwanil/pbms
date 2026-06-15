const { Router } = require('express');
const { getProfile, updateProfile, changePassword } = require('../../controllers/profileController');
const { verifyToken } = require('../../middleware/verifyToken');

const router = Router();

router.use(verifyToken);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
