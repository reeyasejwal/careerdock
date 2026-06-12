const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/taskController');

router.use(auth);
router.get('/', c.getAll);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/reset', c.resetAll);
router.delete('/:id', c.remove);
router.patch('/:id/toggle', c.toggle);
router.patch('/:id/status', c.updateStatus);

module.exports = router;
