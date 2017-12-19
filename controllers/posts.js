const Post = require('../models/post');
const paginate = require('express-paginate');
const geocoder = require('../config/geocoder');
const { cloudinary } = require('../config/cloudinary');

module.exports = {
	index: async (req, res, next) => {
		let posts, filters, query;
		// define escapeRegex function for search feature
		const escapeRegex = (text) => {
		    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
		};
		// check if filters exist
		if (req.query.post) filters = Object.values(req.query.post).join('') ? true : false;
		// check if request has filter(s)
		if (filters) {
				let { search, condition, category, price, location, longitude, latitude  } = req.query.post;
				// build $and query array
				query = [];
				if (search) {
					search = new RegExp(escapeRegex(search), 'gi');
					query.push({ $or: [
						{ title: search },
						{ description: search },
						{ location: search },
						{ condition: search },
						{ category: search }
					]});
				}
				if (condition) {
					if (Array.isArray(condition)) condition = '(' + condition.join('?|') + '?)';
					query.push({ condition: new RegExp(condition, 'gi') });
				}
				if (category) {
					res.locals.category = category; // make category available in view
					if (Array.isArray(category)) category = '(' + category.join('?|') + '?)';
					query.push({ category: new RegExp(category, 'gi') });
				}
				if (price) {
					if (price.min) query.push({ price: { $gte: price.min } });
					if (price.max) query.push({ price: { $lte: price.max } });
				}
				if (longitude && latitude) {
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
				query = query.length ? { $and: query } : {};
		}

		posts = await Post.paginate(query, { page: req.query.page, limit: req.query.limit, sort: { '_id': -1 } });

		if(req.xhr) {
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
				// render index view
			  res.render('posts/index', { 
					title: 'Posts Index', 
					page: 'posts', 
					posts: posts.docs,
					pageNumber: posts.page, 
					pageCount: posts.pages,
			    itemCount: posts.limit,
			    pages: paginate.getArrayPages(req)(3, posts.pages, req.query.page),
			    error: posts.total ? '' : 'No results available for that search'
			  });
		}
	},
	newPost: (req, res, next) => {
  	res.render('posts/new', { title: 'New Post', page: 'new-post' });
	},
	create: async (req, res, next) => {
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
	},
	show: (req, res, next) => {
		Post.findById(req.params.id).populate(
			{
			  path: 'comments',
			  model: 'Comment',
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
	},
	edit: (req, res) => {
		let post = req.post;
	  res.render('posts/edit', { title: post.title , page: 'edit-post', post: post });
	},
	update: async (req, res, next) => {
		// How to combine cb with async here to be DRY? - check this out for manual update -> https://coursework.vschool.io/mongoose-crud/
		// what about deleting the original image? use public_id (need to use regex to extract from image url or store in db)
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
	},
	destroy: (req, res) => {
		post = req.post;
		post.remove();
		req.flash('success', 'Post successfully deleted.');
	  res.redirect('/posts');
	}
};