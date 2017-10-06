const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
	body: String,
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	},
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);