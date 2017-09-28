const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const Post = require('../models/post');
const geocoder = require('geocoder');
const middleware = require('../middleware');
const { asyncMiddleware, isLoggedIn, sanitizeBody, checkPostOwner } = middleware;

//************* Image Upload Configuration *************\\
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, './public/uploads');
  },
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage : storage, fileFilter: imageFilter})

const cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'craigsboards', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
//************* END Image Upload Config *************\\

// INDEX
router.get('/', asyncMiddleware(async (req, res, next) => {
	let posts;
	if(req.query.post) {
		let { search, condition, price, location } = req.query.post;
		let query = [];

		// build $and query array
		if (search) {
			search = new RegExp(search, 'gi');
			query.push({ $or: [ { title: search }, { description: search  } ] });
		}
		if (condition) query.push({ condition: new RegExp(condition, 'i') });
		if (price) query.push({ price: price });
		if (location) query.push({ location: new RegExp(location, 'gi') });
		if (!query.length) {
				posts = [];
		} else {
				posts = await Post.find({
					$and: query
				});
		}
	} else {
			posts = await Post.find();
	}
  res.render('posts/index', { title: 'Posts Index', page: 'posts', posts: posts });
}));

// NEW
router.get('/new', isLoggedIn, (req, res, next) => {
  res.render('posts/new', { title: 'New Post', page: 'new-post' });
});

// CREATE
router.post('/', isLoggedIn, upload.single('image'), sanitizeBody, (req, res, next) => {
	if(!req.file) {
		req.flash('error', 'Please upload an image.');
		return res.redirect('/posts/new');
	}
	cloudinary.uploader.upload(req.file.path, async (result) => { 
		geocoder.geocode(req.body.post.location, async (err, data) => {
	    req.body.post.lat = data.results[0].geometry.location.lat;
	    req.body.post.lng = data.results[0].geometry.location.lng;
			req.body.post.author = req.user._id;
			req.body.post.image = result.secure_url;
			try {
					let post = await Post.create(req.body.post);
					req.flash('success', 'Post created successfully!');
				  res.redirect(`/posts/${post.id}`);
			} catch (err) {
					// test this to be sure it works
					return next(err);
			}
	  });
	});
});

// SHOW
router.get('/:id', (req, res, next) => {
	Post.findById(req.params.id).populate(
		{
		  path: 'comments',
		  model: 'Comment',
		  options: { sort: {'_id': '-1'} },
		  populate: {
		    path: 'author',
		    model: 'User'
		  }
		}).exec(function(err, post) {
		if(err) {
			req.flash('error', err.message);
			return res.redirect('/posts');
		}
	  res.render('posts/show', { title: post.title , page: 'show-post', post: post });
	});
});

// EDIT
router.get('/:id/edit', isLoggedIn, checkPostOwner, (req, res) => {
	let post = req.post;
  res.render('posts/edit', { title: post.title , page: 'edit-post', post: post });
});

// UPDATE
router.put('/:id', isLoggedIn, upload.single('image'), sanitizeBody, asyncMiddleware(async (req, res, next) => {
	// How to combine cb with async here to be DRY? - check this out for manual update -> https://coursework.vschool.io/mongoose-crud/
	if(req.file) {
			cloudinary.uploader.upload(req.file.path, async (result) => { 
				req.body.post.image = result.secure_url;
				let post = await Post.findByIdAndUpdate(req.params.id, req.body.post);
				req.flash('success', 'Post successfully updated.');
				res.redirect(`/posts/${post.id}`);
			});
	} else {
			let post = await Post.findByIdAndUpdate(req.params.id, req.body.post);
			req.flash('success', 'Post successfully updated.');
			res.redirect(`/posts/${post.id}`);
	}
}));

// DESTROY
router.delete('/:id', isLoggedIn, checkPostOwner, (req, res) => {
	post = req.post;
	post.remove();
	req.flash('success', 'Post successfully deleted.');
  res.redirect('/posts');
});

module.exports = router;