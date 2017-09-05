const Post = require('../models/post');
const cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'craigsboards', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = {
	asyncMiddleware: fn =>
	  (req, res, next) => {
	    Promise.resolve(fn(req, res, next))
	      .catch(next);
		},
	// route middleware to make sure a user is logged in
	isLoggedIn: (req, res, next) => {
	    // if user is authenticated in the session, carry on 
	    if(req.isAuthenticated()) return next();
	    // set redirectTo on session so user can go back to original destination after login
	    req.session.redirectTo = req.originalUrl;
	    // if they aren't redirect them to the login page
	    req.flash('error', 'You need to be logged in to do that!');
	    res.redirect('/login');
	},
	sanitizeBody: (req, res, next) => {
		if(req.body.post.description) {
			req.body.post.description = req.sanitize(req.body.post.description);
		}
		next();
	},
	checkPostOwner: async (req, res, next) => {
		try {
				let post = await Post.findById(req.params.id);
				if(!post.author._id.equals(req.user._id)) {
					req.flash('error', 'You\'re not the owner of this post.');
					return res.redirect('/');
				}
				// should post go directly on req or maybe req.session?
				req.post = post;
				next();
		} catch(err) {
				return next(err);
		}
	}
}