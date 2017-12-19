const express = require('express');
const router = express.Router();
const passport = require('passport');
const { asyncMiddleware, isLoggedIn, sanitizeBody, checkPostOwner, findLocation } = require('../middleware');
const { index, newPost, create, show, edit, update, destroy } = require('../controllers/posts');
const { upload } = require('../config/cloudinary');
const paginate = require('express-paginate');

router.use(paginate.middleware(9, 50));
router.use(isLoggedIn);

// INDEX
router.get('/', asyncMiddleware(index));

// NEW
router.get('/new', newPost);

// CREATE
router.post('/', upload.single('image'), sanitizeBody, asyncMiddleware(create));

// SHOW
router.get('/:id', show);

// EDIT
router.get('/:id/edit', checkPostOwner, edit);

// UPDATE
router.put('/:id', upload.single('image'), sanitizeBody, asyncMiddleware(update));

// DESTROY
router.delete('/:id', checkPostOwner, destroy);

module.exports = router;