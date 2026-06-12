const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { uploadJd } = require('../middleware/upload');
const c = require('../controllers/applicationController');

router.use(auth);
router.get('/', c.getAll);
router.post('/', uploadJd.single('jdFile'), c.create);
router.get('/:id', c.getOne);
router.put('/:id', uploadJd.single('jdFile'), c.update);
router.delete('/:id', c.remove);
router.patch('/:id/important', c.toggleImportant);
router.patch('/:id/status', c.updateStatus);
router.get('/:id/jd-text', c.getJdText);
router.post('/:id/jd-text', c.saveJdText);

module.exports = router;
