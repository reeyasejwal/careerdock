const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/chatController');

router.use(auth);
router.get('/conversations', c.getConversations);
router.post('/new', c.newConversation);
router.get('/:convId/messages', c.getMessages);
router.post('/message', c.sendMessage);
router.delete('/:convId', c.deleteConversation);

module.exports = router;
