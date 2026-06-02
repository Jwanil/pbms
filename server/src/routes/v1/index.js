const { Router } = require('express');
const healthRouter = require('./health');
const authRouter = require('./auth');
const usersRouter = require('./users');
const categoriesRouter = require('./categories');
const gradesRouter = require('./grades');
const packagingRouter = require('./packaging');
const departmentsRouter = require('./departments');
const rolesRouter = require('./roles');
const productsRouter = require('./products');
const companiesRouter = require('./companies');
const mappingsRouter = require('./mappings');
const contactsRouter = require('./contacts');
const dashboardRouter = require('./dashboard');

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/categories', categoriesRouter);
router.use('/grades', gradesRouter);
router.use('/packaging', packagingRouter);
router.use('/departments', departmentsRouter);
router.use('/roles', rolesRouter);
router.use('/products', productsRouter);
router.use('/companies', companiesRouter);
router.use('/mappings', mappingsRouter);
router.use('/contacts', contactsRouter);
router.use('/dashboard', dashboardRouter);

module.exports = router;