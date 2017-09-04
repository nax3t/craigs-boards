const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const Post = require('../models/post');
const middleware = require('../middleware');
// destructuring assignment for middleware
const { asyncMiddleware, isLoggedIn, sanitizeBody } = middleware;

router.get('/', asyncMiddleware(async (req, res, next) => {
  let posts = await Post.find({});
  res.render('posts/index', { title: 'Posts Index', page: 'posts', posts: posts });
}));

router.get('/new', isLoggedIn, (req, res, next) => {
  res.render('posts/new', { title: 'New Post', page: 'new-post' });
});

router.post('/', isLoggedIn, sanitizeBody, asyncMiddleware(async (req, res, next) => {
	req.body.post.author = req.user;
	let post = await Post.create(req.body.post);
	req.flash('success', 'Post created successfully!');
  res.redirect(`/posts/${post.id}`);
}));

router.get('/:id', asyncMiddleware(async (req, res, next) => {
	let post = await Post.findById(req.params.id).populate('author');
  res.render('posts/show', { title: post.title , page: 'show-post', post: post });
}));

module.exports = router;