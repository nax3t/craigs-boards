const path = require('path');

module.exports = {
	entry: [
		'./src/close-alerts.js',
		'./src/activate-places-search.js',
		'./src/zip-search.js',
		'./src/post-filter.js',
		'./src/post-comments.js'
	],
	output: {
		path: path.resolve(__dirname, './public/javascripts'),
		filename: 'bundle.js'
	}
}