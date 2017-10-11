const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const Post = require('../models/post');
// const geocoder = require('geocoder');
const middleware = require('../middleware');
const { asyncMiddleware, isLoggedIn, sanitizeBody, checkPostOwner, findLocation } = middleware;
// require and configure express-paginate
const paginate = require('express-paginate');
router.use(paginate.middleware(9, 50));
// require and configure node-geocoder
const NodeGeocoder = require('node-geocoder');
const options = {
  provider: 'google'
};
const geocoder = NodeGeocoder(options);

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
	let posts, filters;
	// check if filters exist
	if (req.query.post) filters = Object.values(req.query.post).join('') ? true : false;

	// check if request sent with ajax and has filter(s)
	if (req.xhr && filters) {
			let { search, condition, price, location, longitude, latitude  } = req.query.post;
			let query = [];
			// build $and query array
			if (search) {
				search = new RegExp(search, 'gi');
				query.push({ $or: [ { title: search }, { description: search  }, { location: search } ] });
			}
			if (condition) {
				if (Array.isArray(condition)) condition = '(' + condition.join('?|') + '?)';
				query.push({ condition: new RegExp(condition, 'gi') });
			}
			if (price) query.push({ price: price });
			if (location && longitude && latitude) {
				// get the max distance or set it to 25 mi
				let maxDistance = req.query.post.distance || 25;
				// we need to convert the distance to degrees, one degree is approximately 69 miles
				maxDistance /= 69;
				// get coordinates [ <longitude> , <latitude> ]
				let coords = [
					longitude,
					latitude
				];
				query.push({ 
		    	coordinates: {
		      	$near: coords,
		      	$maxDistance: maxDistance
		    	} 
		    });
			}
			posts = await Post.paginate({
				$and: query
			}, { page: req.query.page, limit: req.query.limit, sort: { '_id': -1 } });
			// send back json with status of 200 (OK)
			res.status(200).json({
				posts: posts.docs,
				pageNumber: posts.page, 
				has_next: paginate.hasNextPages(req)(posts.pages),
				has_prev: req.query.page > 1,
				pages: paginate.getArrayPages(req)(3, posts.pages, req.query.page),
				nextUrl: paginate.href(req)(),
				prevUrl: paginate.href(req)(true)
			});
	} else if (req.xhr && !filters) {
			posts = await Post.paginate({}, { page: req.query.page, limit: req.query.limit, sort: { '_id': -1 } });
			// send back json with status of 200 (OK)
			res.status(200).json({
				posts: posts.docs,
				pageNumber: posts.page, 
				has_next: paginate.hasNextPages(req)(posts.pages),
				has_prev: req.query.page > 1,
				pages: paginate.getArrayPages(req)(3, posts.pages, req.query.page),
				nextUrl: paginate.href(req)(),
				prevUrl: paginate.href(req)(true)
			});
	} else {
			// if request wasn't sent with ajax then run regular query and render index view
			posts = await Post.paginate({}, { page: req.query.page, limit: req.query.limit, sort: { '_id': -1 } });
		  res.render('posts/index', { 
				title: 'Posts Index', 
				page: 'posts', 
				posts: posts.docs,
				pageNumber: posts.page, 
				pageCount: posts.pages,
		    itemCount: posts.limit,
		    pages: paginate.getArrayPages(req)(3, posts.pages, req.query.page) 
		  });
	}
}));

// NEW
router.get('/new', isLoggedIn, (req, res, next) => {
  res.render('posts/new', { title: 'New Post', page: 'new-post' });
});

// CREATE
router.post('/', isLoggedIn, upload.single('image'), sanitizeBody, asyncMiddleware(async (req, res, next) => {
	if(!req.file) {
		req.flash('error', 'Please upload an image.');
		return res.redirect('/posts/new');
	}
	let result = await cloudinary.uploader.upload(req.file.path);
	let geoLocation = await geocoder.geocode(req.body.post.location);
  req.body.post.coordinates = [geoLocation[0].longitude, geoLocation[0].latitude];
	req.body.post.author = req.user._id;
	req.body.post.image = result.secure_url;
	let post = await Post.create(req.body.post);
	req.flash('success', 'Post created successfully!');
  res.redirect(`/posts/${post.id}`);
}));

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