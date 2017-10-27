const path = require('path');

module.exports = {
	entry: [
		'./src/init-map',
		'./src/close-alerts.js',
		'./src/activate-places-search.js',
		'./src/zip-search.js',
		'./src/post-comments.js'
	],
	output: {
		path: path.resolve(__dirname, './public/javascripts'),
		filename: 'bundle.js'
	},
	module: {
		loaders: [
			{
				loader: 'babel-loader',
				test: /\.js$/,
				exclude: /node_modules/
			}
		]
	},
	devServer: {
		port: 3000,
		contentBase: './build',
		inline: true
	}
}