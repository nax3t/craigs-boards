const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
	title: String,
	description: String,
	price: Number,
	condition: String,
	location: String,
	lat: Number,
	lng: Number,
	image: String,
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

module.exports = mongoose.model('Post', PostSchema);