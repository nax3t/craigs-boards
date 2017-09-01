const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
	// username, salt, & hash are already added by passport-local-mongoose
	email: String
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);