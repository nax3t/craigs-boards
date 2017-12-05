const Post = require('./models/post');
const Comment = require('./models/comment');
const User = require('./models/user');
const faker = require('faker');
const cities = require('./cities');

const seedDB = async () => {
	await User.remove({});
	await Post.remove({});
	await Comment.remove({});
	console.log('Users, posts, and comments removed');
	try {
			let userData = {
				username: faker.internet.userName(),
				email: faker.internet.email(),
				password: faker.internet.password()
			}
			let user = await User.create(userData);
			let conditions = ['Excellent', 'Good', 'Poor'];
			let categories = ['Short', 'Long', 'Fish', 'Gun', 'Foam']
			for(var i = 0; i < 600; i++) {
				try {
						let random3 = Math.floor(Math.random() * 3);
						let category = categories[Math.floor(Math.random() * 5)];
						let image = category === 'Short' ? 'https://goo.gl/zsAmDJ' : 'Long' ? 'https://goo.gl/wcDZHj' : 'Fish' ? 'https://goo.gl/KYTqPo' : 'Gun' ? 'https://goo.gl/Sm1Rjo' : 'https://goo.gl/AMLyNK';
						let random1000 = Math.floor(Math.random() * 1000);
						let postData = {
							title: faker.lorem.word(),
							description: faker.lorem.sentence(),
							price: faker.commerce.price(),
							condition: conditions[random3],
							image: image,
							location: `${cities[random1000].city}, ${cities[random1000].state}`,
							coordinates: [cities[random1000].longitude, cities[random1000].latitude],
							category: category,
							author: user
						}
						await Post.create(postData);
				} catch(err) {
					  console.log(err);
				}
			}
			console.log('All posts created!');
	} catch(err) {
		  console.log(err);
	}
};

module.exports = seedDB;