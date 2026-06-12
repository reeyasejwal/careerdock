const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/dashboardController');

router.use(auth);
router.get('/stats', c.getStats);
router.get('/streak', c.getStreak);
router.post('/checkin', c.checkin);
router.get('/upcoming', c.getUpcoming);
router.get('/urgent-count', c.getUrgentCount);
router.get('/activity', c.getActivity);

module.exports = router;
