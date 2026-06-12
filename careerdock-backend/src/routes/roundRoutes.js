const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/roundController');

router.use(auth);
router.get('/application/:appId', c.getByApplication);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
