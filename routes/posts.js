const express = require('express');
const router = express.Router();
const passport = require('passport');
const { asyncMiddleware, isLoggedIn, sanitizeBody, checkPostOwner, findLocation } = require('../middleware');
const { index, newPost, create, show, edit, update, destroy } = require('../middleware/posts');
const { upload } = require('../config/cloudinary');
const paginate = require('express-paginate');

router.use(paginate.middleware(9, 50));

// INDEX
router.get('/', asyncMiddleware(index));

// NEW
router.get('/new', isLoggedIn, newPost);

// CREATE
router.post('/', isLoggedIn, upload.single('image'), sanitizeBody, asyncMiddleware(create));

// SHOW
router.get('/:id', show);

// EDIT
router.get('/:id/edit', isLoggedIn, checkPostOwner, edit);

// UPDATE
router.put('/:id', isLoggedIn, upload.single('image'), sanitizeBody, asyncMiddleware(update));

// DESTROY
router.delete('/:id', isLoggedIn, checkPostOwner, destroy);

module.exports = router;