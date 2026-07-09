const {Router} = require('express');
const { superAdminGuard } = require('../../middleware/roleGuard');


const{
    getEnquiriesController, getEnquiryByIdController, createEnquiryController,respondToEnquiryController, updateStatusController, getMyEnquiriesController
} = require('../../controllers/enquiryController')

const { verifyToken } = require('../../middleware/verifyToken');
const router = Router();

router.get('/mine', verifyToken, getMyEnquiriesController);
router.post('/', verifyToken, createEnquiryController);
router.get('/admin', verifyToken,superAdminGuard(), getEnquiriesController);
router.get('/:id', verifyToken, getEnquiryByIdController);
router.patch('/:id/status', verifyToken, superAdminGuard(), updateStatusController);
router.post('/:id/respond', verifyToken, superAdminGuard(), respondToEnquiryController);

module.exports = router;
