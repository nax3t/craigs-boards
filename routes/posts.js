const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const Post = require('../models/post');
const middleware = require('../middleware');
// destructuring assignment for middleware
const { asyncMiddleware, isLoggedIn, sanitizeBody, checkPostOwner } = middleware;

// INDEX
router.get('/', asyncMiddleware(async (req, res, next) => {
  let posts = await Post.find({});
  res.render('posts/index', { title: 'Posts Index', page: 'posts', posts: posts });
}));

// NEW
router.get('/new', isLoggedIn, (req, res, next) => {
  res.render('posts/new', { title: 'New Post', page: 'new-post' });
});

// CREATE
router.post('/', isLoggedIn, sanitizeBody, asyncMiddleware(async (req, res, next) => {
	req.body.post.author = req.user._id;
	let post = await Post.create(req.body.post);
	req.flash('success', 'Post created successfully!');
  res.redirect(`/posts/${post.id}`);
}));

// SHOW
router.get('/:id', asyncMiddleware(async (req, res, next) => {
	let post = await Post.findById(req.params.id);
  res.render('posts/show', { title: post.title , page: 'show-post', post: post });
}));

// EDIT
router.get('/:id/edit', isLoggedIn, asyncMiddleware(async (req, res, next) => {
	let post = await Post.findById(req.params.id);
	checkPostOwner(req, res, next, post);
  res.render('posts/edit', { title: post.title , page: 'edit-post', post: post });
}));

// UPDATE
router.put('/:id', isLoggedIn, asyncMiddleware(async (req, res, next) => {
	// Best way to handle checkPostOwner middleware here?
	let post = await Post.findByIdAndUpdate(req.params.id, req.body.post);
	req.flash('success', 'Post successfully updated.');
	res.redirect(`/posts/${post.id}`);
}));

// DESTROY
router.delete('/:id', isLoggedIn, asyncMiddleware(async (req, res, next) => {
	let post = await Post.findById(req.params.id);
	checkPostOwner(req, res, next, post);
	post.remove();
	req.flash('success', 'Post successfully deleted.');
  res.redirect('/posts');
}));

module.exports = router;