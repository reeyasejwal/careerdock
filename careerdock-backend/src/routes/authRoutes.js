const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/authController');

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/reset-password', c.resetPassword);
router.get('/profile', auth, c.getProfile);
router.put('/profile', auth, c.updateProfile);
router.put('/password', auth, c.updatePassword);
router.put('/theme', auth, c.updateTheme);
router.delete('/account', auth, c.deleteAccount);

module.exports = router;
