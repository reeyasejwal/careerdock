const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { uploadResume } = require('../middleware/upload');
const c = require('../controllers/resumeController');

router.use(auth);
router.get('/', c.getAll);
router.post('/upload', uploadResume.single('resume'), c.upload);
router.delete('/:id', c.remove);
router.patch('/:id/active', c.setActive);
router.post('/ats-score', c.atsScore);
router.get('/:id/suggestions', c.getSuggestions);
router.get('/:id/extract-text', c.extractTextDebug);

module.exports = router;
