const express = require('express');
const router  = express.Router({mergeParams: true});
const { asyncMiddleware, isLoggedIn } = require('../middleware');
const { create, destroy } = require('../middleware/comments');

// CREATE
router.post('/', isLoggedIn, asyncMiddleware(create));

// DESTROY
router.delete('/:comment_id', isLoggedIn, asyncMiddleware(destroy));

module.exports = router;