const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/plannerController');

router.use(auth);
router.get('/calendar/:year/:month', c.getCalendar);
router.post('/events', c.addEvent);
router.delete('/events/:id', c.removeEvent);
router.get('/integrations', c.getIntegrations);
router.post('/integrations', c.saveIntegration);
router.get('/leetcode/:username', c.getLeetcodeStats);
router.get('/github/:username', c.getGithubRepos);
router.post('/leetcode-notes', c.saveLeetcodeNote);
router.get('/leetcode-notes', c.getLeetcodeNotes);
router.post('/integrations/github/notes', c.saveGithubNote);
router.delete('/integrations/github/notes', c.deleteGithubNote);
router.get('/integrations/github/notes/:username', c.getGithubNotes);

module.exports = router;
