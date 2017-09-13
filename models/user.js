const mongoose = require('mongoose');
const bcrypt   = require('bcrypt-nodejs');
const Post = require('./post');
const Comment = require('./comment');

const UserSchema = mongoose.Schema({
		resetPw: {
			resetPasswordToken: String,
			resetPasswordExpires: Date
		},
    local: {
      username: String,
      email: String,
      password: String
    },
    facebook: {
      id: String,
      token: String,
      email: String,
      name: String
    }
});

// methods ======================
// generating a hash
UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// pre-hook middleware to delete all user's posts and comments from db when user is deleted
UserSchema.pre('remove', async function(next) {
  try {
      await Post.remove({ 'author': { '_id': this._id } });
      await Comment.remove({ 'author': { '_id': this._id } });
      next();
  } catch (err) {
      // does this work?
      next(err);
  }
});

module.exports = mongoose.model('User', UserSchema);