const passport = require('passport');
const mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_KEY, domain: 'www.iantskon.com'});
const async = require('async');
const crypto = require('crypto');
const User = require('../models/user');
const Post = require('../models/post');
const passportConfig = require('../config/passport');
passportConfig(passport);

module.exports = {
	index: async (req, res, next) => {
		let posts = await Post.find({}).sort({'_id': 1}).limit(4);
	  res.render('index', { title: 'Board Maps', page: 'home', posts: posts });
	},
	getSignup: (req, res) => {
	  res.render('users/signup', {title: 'User Sign-up', page: 'signup', username: '', email: ''});
	},
	postSignup: passport.authenticate('local-signup', {
	    successRedirect: '/', // redirect to the secure profile section
	    failureRedirect: '/signup', // redirect back to the signup page if there is an error
	    failureFlash: true // allow flash messages
	}),
	getLogin: (req, res) => {
		res.render('users/login', {title: 'User Login', page: 'login'});
	},
	postLogin: (req, res, next) => {
	  passport.authenticate('local-login', (err, user, info) => {
	    if (err) return next(err);
	    if (!user) return res.redirect('/login');
	    req.logIn(user, (err) => {
	      if (err) return next(err);
	      let redirectTo = req.session.redirectTo ? req.session.redirectTo : '/posts';
	      delete req.session.redirectTo;
	      req.flash('success', 'Welcome back!');
	      res.redirect(redirectTo);
	    });
	  })(req, res, next);
	},
	getProfile: (req, res) => {
	  res.render('users/profile', {title: 'User Profile', page: 'profile'});
	},
	logout: (req, res) => {
	  req.logout();
	  req.flash('success', 'See you next time!');
	  res.redirect('/');
	},
	update: (req, res) => {
	  User.findById(req.user._id, (err, user) => {
	    if (err) {
	      return next(err);
	    }
	    if (user.validPassword(req.body.currentPassword)) {
	      if (req.body.password === req.body.confirm) {
	          user.local.password = user.generateHash(req.body.password);
	          user.save((err) => {
	            req.logIn(user, (err) => {
	              req.flash('success', 'Password updated successfully!');
	              res.redirect('/profile');
	            });
	          });
	      } else {
	          req.flash("error", "Passwords do not match.");
	          return res.redirect('/profile');
	      }
	    } else {
	        req.flash("error", "Incorrect password.");
	        return res.redirect('/profile');
	    }
	  })
	},
	getFbAuth: (req,res,next) => {
    passport.authenticate(
      'facebook',
      {
        callbackURL:`/auth/facebook/callback/${req.params.action}`,
        scope: 'email'
      }
    )(req, res, next);
	},
	getFbAuthCb: passport.authenticate('facebook', {
	  callbackURL: '/auth/facebook/callback/login',
	  successRedirect: '/posts',
	  failureRedirect: '/login',
	  successFlash: 'Welcome back!',
	  failureFlash: 'Facebook login failed!'
  }),
  getConnectLocal: (req, res) => {
	  res.render('users/connect-local', { message: req.flash('loginMessage') });
	},
	postConnectLocal: passport.authenticate('local-signup', {
	  successRedirect: '/profile', // redirect to the secure profile section
	  failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
	  failureFlash: true // allow flash messages
	}),
	connectFbCb: passport.authenticate('facebook', {
    callbackURL: '/auth/facebook/callback/connect',
    successRedirect: '/profile',
    failureRedirect: '/'
  }),
  unlinkLocal: async (req, res, next) => {
	  let user = req.user;
	  user.local.username = undefined;
	  user.local.email    = undefined;
	  user.local.password = undefined;
	  if (!user.facebook.token) {
	    await user.save();
	    await user.remove();
	    return res.redirect('/logout');
	  }
	  await user.save();
	  res.redirect('/profile');
	},
	unlinkFb: async (req, res, next) => {
	  let user = req.user;
	  user.facebook.token = undefined;
	  user.facebook.email = undefined;
	  user.facebook.name = undefined;
	  if (!user.local.username) {
	    await user.save();
	    await user.remove();
	    return res.redirect('/logout');
	  }
	  await user.save();
	  res.redirect('/profile');
	},
	getForgot: (req, res) => {
	  res.render('users/forgot', {title: 'Password Reset'});
	},
	postForgot: (req, res, next) => {
	  async.waterfall([
	    (done) => {
	      crypto.randomBytes(20, (err, buf) => {
	        var token = buf.toString('hex');
	        done(err, token);
	      });
	    },
	    (token, done) => {
	      User.findOne({ 'local.username': req.body.username }, (err, user) => {
	        if (!user) {
	          req.flash('error', 'No account with that username exists.');
	          return res.redirect('/forgot');
	        }

	        user.resetPasswordToken = token;
	        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

	        user.save((err) => {
	          done(err, token, user);
	        });
	      });
	    },
	    (token, user, done) => {
	      let data = {
	        from: 'learntocodeinfo@gmail.com',
	        to: user.local.email,
	        subject: `Craig's Boards - Password Reset`,
	        html: `
	          <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
	          <p>Please click on the following <a href="http://${req.headers.host}/reset/${token}">link</a>, or paste this into your browser to complete the process:</p>
	          <p>http://${req.headers.host}/reset/${token}</p>
	          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
	        `
	      };
	       
	      mailgun.messages().send(data, (err, body) => {
	        req.flash('success', `An e-mail has been sent to ${user.local.username} with further instructions.`);
	        done(err, 'done');
	      });
	    }
	  ], (err) => {
	    if (err) return next(err);
	    res.redirect('/forgot');
	  });
	},
	getResetToken: (req, res) => {
	  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
	    if (!user) {
	      req.flash('error', 'Password reset token is invalid or has expired.');
	      return res.redirect('/forgot');
	    }
	    res.render('users/reset', {title: 'Password Reset'});
	  });
	},
	postResetToken: (req, res) => {
	  async.waterfall([
	    (done) => {
	      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
	        if (!user) {
	          req.flash('error', 'Password reset token is invalid or has expired.');
	          return res.redirect('back');
	        } else if (req.body.password === req.body.confirm) {
	            user.local.password = user.generateHash(req.body.password);
	            user.resetPasswordToken = undefined;
	            user.resetPasswordExpires = undefined;
	            user.save((err) => {
	              req.logIn(user, (err) => {
	                done(err, user);
	              });
	            });
	        } else {
	          req.flash("error", "Passwords do not match.");
	          return res.redirect('back');
	        }
	      });
	    },
	    (user, done) => {
	      let data = {
	        from: 'learntocodeinfo@gmail.com',
	        to: user.local.email,
	        subject: 'Craig\'s Boards - Password Reset',
	        html: `
	          <h4>Hello ${user.local.username},</h4>
	          <p>This is a confirmation that the password for your account ${user.local.email} has just been changed.</p>
	        `
	      };
	       
	      mailgun.messages().send(data, (err, body) => {
	        req.flash('success', 'Success! Your password has been changed.');
	        done(err);
	      });
	    }
	  ], (err) => {
	    res.redirect('/');
	  });
	}
};