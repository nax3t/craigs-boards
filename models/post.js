const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
	title: String,
	description: String,
	price: Number,
	condition: String,
	location: String,
	category: String,
	coordinates: {
		type: [Number],  // [<longitude>, <latitude>]
		index: '2d'      // create the geospatial index
	},
	image: String,
	comments: [
		{
		   type: mongoose.Schema.Types.ObjectId,
		   ref: "Comment"
		}
	],
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	},
	createdAt: { type: Date, default: Date.now }
});

// pre-hook middleware to populate author in post show route
PostSchema.pre('findOne', function(next) {
  this.populate('author');
  next();
});

PostSchema.plugin(require('mongoose-paginate'));

module.exports = mongoose.model('Post', PostSchema);