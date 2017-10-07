const express = require("express");
const router  = express.Router({mergeParams: true});
const Post = require("../models/post");
const Review = require("../models/review");
const middleware = require("../middleware");
const { isLoggedIn } = middleware;

// Using callbacks here, what's best way to write this w/ async+await?

// CREATE
router.post("/", isLoggedIn, (req, res, next) => {
	if(!req.body.review.body) {
		return res.json({'bodyError': 'Review must be filled out.'});
	}
	Post.findById(req.params.id, (err, post) => {
		if(err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		req.body.review.author = req.user._id;
		Review.create(req.body.review, (err, review) => {
			if(err) {
				console.log(err.message);
				return res.status(500).json(err);
			}
			post.reviews.push(review);
			post.save(() => {
				let author = req.user.local.username || req.user.facebook.name;
				res.status(200).json({review: review, author: author});
			});
		});
	});
});

module.exports = router;