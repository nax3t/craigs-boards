const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const Post = require('../models/post');
const async = require('async');
const crypto = require('crypto');
const middleware = require('../middleware');
const { asyncMiddleware, isLoggedIn } = middleware;
const mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_KEY, domain: 'www.iantskon.com'});

// pass passport for configuration
require('../config/passport')(passport);

router.get('/', asyncMiddleware( async(req, res, next) => {
  let posts = await Post.find();
  res.render('index', { title: 'Express', page: 'home', posts: posts });
}));

router.get('/signup', (req, res) => {
  res.render('users/signup', {title: 'User Sign-up', page: 'signup', username: '', email: ''});
});

// process the signup form
router.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

router.get('/login', (req, res) => {
	res.render('users/login', {title: 'User Login', page: 'login'});
});

router.post('/login', passport.authenticate('local-login', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

router.get('/profile', isLoggedIn, asyncMiddleware(async (req, res, next) => {
  res.render('users/profile', {title: 'User Profile'});
}));

router.put('/users', (req, res) => {
  User.findById(req.user._id, (err, user) => {
    if (err) {
      return next(err);
    }
    if (user.validPassword(req.body.currentPassword)) {
      if (req.body.password === req.body.confirm) {
          user.local.password = user.generateHash(req.body.password);
          user.resetPw.resetPasswordToken = undefined;
          user.resetPw.resetPasswordExpires = undefined;

          user.save(function(err) {
            req.logIn(user, function(err) {
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
  });
});

// ====================================
// FACEBOOK ROUTES ====================
// ====================================
// route for facebook authentication and login
router.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

// handle the callback after facebook has authenticated the user
router.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect : '/',
    failureRedirect : '/login'
  }));

router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'See you next time!');
  res.redirect('/');
});

// ==============================================
// CONNECT ALREADY LOGGED IN ACCOUNT ============
// ==============================================

router.get('/connect/local', isLoggedIn, function(req, res) {
  res.render('users/connect-local', { message: req.flash('loginMessage') });
});

router.post('/connect/local', passport.authenticate('local-signup', {
  successRedirect: '/profile', // redirect to the secure profile section
  failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
  failureFlash: true // allow flash messages
}));

// ====================================
// UNLINK LOCAL AND FACEBOOK ==========
// ====================================

router.get('/unlink/local', isLoggedIn, asyncMiddleware(async (req, res, next) => {
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
}));

// facebook -------------------------------
router.get('/unlink/facebook', isLoggedIn, asyncMiddleware(async (req, res, next) => {
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
}));

// ====================================
// PASSWORD RESET =====================
// ====================================

// forgot password
router.get('/forgot', (req, res) => {
  res.render('users/forgot', {title: 'Password Reset'});
});

router.post('/forgot', (req, res, next) => {
  async.waterfall([
    (done) => {
      crypto.randomBytes(20, (err, buf) => {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    (token, done) => {
      User.findOne({ email: req.body.email }, (err, user) => {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPw.resetPasswordToken = token;
        user.resetPw.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save((err) => {
          done(err, token, user);
        });
      });
    },
    (token, user, done) => {
      let data = {
        from: 'learntocodeinfo@gmail.com',
        to: user.email,
        subject: `Craig's Boards - Password Reset`,
        html: `
          <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
          <p>Please click on the following <a href="http://${req.headers.host}/reset/${token}">link</a>, or paste this into your browser to complete the process:</p>
          <p>http://${req.headers.host}/reset/${token}</p>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        `
      };
       
      mailgun.messages().send(data, (err, body) => {
        req.flash('success', `An e-mail has been sent to ${user.email} with further instructions.`);
        done(err, 'done');
      });
    }
  ], (err) => {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', (req, res) => {
  User.findOne({ resetPw: { resetPasswordToken: req.params.token } }, { resetPw: { resetPasswordExpires: { $gt: Date.now() } } }, (err, user) => {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('users/reset', {title: 'Password Reset'});
  });
});

router.post('/reset/:token', (req, res) => {
  async.waterfall([
    (done) => {
      User.findOne({ resetPw: { resetPasswordToken: req.params.token } }, { resetPw: { resetPasswordExpires: { $gt: Date.now() } } }, (err, user) => {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        } else if (req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
              user.resetPw.resetPasswordToken = undefined;
              user.resetPw.resetPasswordExpires = undefined;

              user.save(function(err) {
                req.logIn(user, function(err) {
                  done(err, user);
                });
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
        to: user.email,
        subject: 'Craig\'s Boards - Password Reset',
        html: `
          <h4>Hello ${user.username},</h4>
          <p>This is a confirmation that the password for your account ${user.email} has just been changed.</p>
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
});

// secret route for quick login during development - REMOVE ME LATER
router.get("/secret", (req, res, next) => {
    req.body = {
        username: "ian",
        password: "password"
    }
    next();
}, passport.authenticate("local", 
    {
        successRedirect: "/posts",
        failureRedirect: "/login"
    }), (req, res) => {
});

module.exports = router;
