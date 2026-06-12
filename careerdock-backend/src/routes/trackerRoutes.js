const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/trackerController');

router.use(auth);
router.get('/', c.getAll);
router.get('/:appId', c.getOne);
router.post('/notes', c.saveNote);
router.get('/notes/:appId', c.getNote);
router.get('/company-info/:appId', c.getCompanyInfo);
router.post('/company-info/:appId/refresh', c.refreshCompanyInfo);

module.exports = router;
