const express = require('express');
const router  = express.Router({mergeParams: true});
const { asyncMiddleware, isLoggedIn } = require('../middleware');
const { create, update, destroy } = require('../controllers/comments');

router.use(isLoggedIn);

// CREATE
router.post('/', asyncMiddleware(create));

// UPDATE
router.put('/:comment_id', asyncMiddleware(update));

// DESTROY
router.delete('/:comment_id', asyncMiddleware(destroy));

module.exports = router;