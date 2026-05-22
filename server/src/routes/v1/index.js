const { Router } = require('express');
const healthRouter = require('./health');

const router = Router();

router.use('/health', healthRouter);

// Additional routes registered here in subsequent phases

module.exports = router;
