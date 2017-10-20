const express = require('express');
const router  = express.Router({mergeParams: true});
const { asyncMiddleware, isLoggedIn } = require('../middleware');
const { create } = require('../middleware/comments');

// CREATE
router.post('/', isLoggedIn, asyncMiddleware(create));

module.exports = router;