const Post = require('./models/post');
const User = require('./models/user');
const faker = require('faker');
const cities = require('./cities');

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
			let conditions = ['Excellent', 'Good', 'Poor'];
			for(var i = 0; i < 30; i++) {
				try {
						let random3 = Math.floor(Math.random() * 3);
						let random1000 = Math.floor(Math.random() * 1000);
						let postData = {
							title: faker.lorem.word(),
							description: faker.lorem.sentence(),
							price: faker.commerce.price(),
							condition: conditions[random3],
							image: 'https://images.unsplash.com/photo-1439367774447-505de3bd8423?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&s=49e687873fe2e886a6b7a0fbe333f29d',
							location: `${cities[random1000].city}, ${cities[random1000].state}`,
							lat: cities[random1000].latitude,
							lng: cities[random1000].longitude,
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