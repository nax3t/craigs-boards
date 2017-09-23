const Post = require('./models/post');
const User = require('./models/user');
const faker = require('faker');

const seedDB = async () => {
	await User.remove({});
	await Post.remove({});
	console.log('Users and posts removed');
	try {
			let userData = {
				username: faker.internet.userName(),
				email: faker.internet.email(),
				password: faker.internet.password()
			}
			let user = await User.create(userData);
			for(var i = 0; i <= 100; i++) {
				try {
						let postData = {
							title: faker.lorem.word(),
							description: faker.lorem.sentence(),
							price: faker.commerce.price(),
							condition: 'Excellent',
							image: faker.image.imageUrl(),
							lat: faker.address.latitude(),
							lng: faker.address.longitude(),
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