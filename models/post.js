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
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	},
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);