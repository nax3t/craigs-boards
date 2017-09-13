const express = require("express");
const router  = express.Router({mergeParams: true});
const Post = require("../models/post");
const Comment = require("../models/comment");
const middleware = require("../middleware");
const { isLoggedIn } = middleware;

// Using callbacks here, what's best way to write this w/ async+await?

// CREATE
router.post("/", isLoggedIn, (req, res, next) => {
	if(!req.body.comment.body) {
		return res.json({'bodyError': 'Comment must be filled out.'});
	}
	Post.findById(req.params.id, (err, post) => {
		if(err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		req.body.comment.author = req.user._id;
		Comment.create(req.body.comment, (err, comment) => {
			if(err) {
				req.flash('error', err.message);
				return res.redirect('back');
			}
			post.comments.push(comment);
			post.save(() => {
				let author = req.user.local.username || req.user.facebook.name;
				res.status(200).json({comment: comment, author: author});
			});
		});
	});
});

module.exports = router;