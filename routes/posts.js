const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const Post = require('../models/post');
const middleware = require('../middleware');
// destructuring assignment for middleware
const { isLoggedIn, sanitizeBody } = middleware;

router.get('/', function(req, res, next) {
	Post.find({}, function(err, posts) {
		if(err) {
			req.flash('error', err.message);
			return res.redirect('/');
		}
	  res.render('posts/index', { title: 'Posts Index', page: 'posts', posts: posts });
	});
});

router.get('/new', isLoggedIn, function(req, res, next) {
	// GET all posts from DB
  res.render('posts/new', { title: 'New Post', page: 'new-post' });
});

router.post('/', isLoggedIn, sanitizeBody, function(req, res, next) {
	Post.create(req.body.post, function(err, post) {
		if(err) {
			// this needs to be tested!!!
			req.flash('error', err.message);
			return res.redirect('/posts/new');
		}
		// add logged in user to post as author
		post.author = req.user;
		post.save();

		req.flash('success', 'Post created successfully!');
	  res.redirect('/posts');
	});
});

router.get('/:id', function(req, res, next) {
	Post.findById(req.params.id).populate('author').exec(function(err, post) {
		if(err) {
			// this needs to be tested!!!
			req.flash('error', err.message);
			return res.redirect('back');
		}
	  res.render('posts/show', { title: post.title , page: 'show-post', post: post });
	});
});

module.exports = router;