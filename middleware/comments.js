const Post = require('../models/post');
const Comment = require('../models/comment');

module.exports = {
	create: async (req, res, next) => {
		if(!req.body.comment.body) {
			return res.status(500).json({'bodyError': 'Comment must be filled out.'});
		}
		let post = await Post.findById(req.params.id);
		req.body.comment.author = req.user._id;
		req.body.comment.body = req.sanitize(req.body.comment.body);
		let comment = await Comment.create(req.body.comment);
		await post.comments.push(comment);
		await post.save();
		let author = req.user.local.username || req.user.facebook.name;
		res.status(200).json({post: post, comment: comment, author: author});
	},
	update: async(req, res, next) => {
		let comment = await Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, {new: true});
		let author = req.user.local.username || req.user.facebook.name;
		res.status(200).json({comment: comment, author: author});
	},
	destroy: async(req, res, next) => {
		let comment = await Comment.findById(req.params.comment_id);
		await comment.remove();
		res.status(200).json({message: 'Comment deleted successfully'});
	}
};