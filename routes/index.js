const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const middleware = require('../middleware');
const { asyncMiddleware, isLoggedIn } = middleware;

router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express', page: 'home' });
});

router.get('/signup', (req, res) => {
  res.render('users/signup', {title: 'User Sign-up', page: 'signup', username: '', email: ''});
});

router.post('/signup', (req, res) => {
	let newUser = new User({username: req.body.username, email: req.body.email});
	User.register(newUser, req.body.password, (err, user) =>{
	  if(err){
			// return out of callback and render the signup view with 
			// error message as flash and prefilled form inputs for username and email
	    return res.render('users/signup', 
        {
          error: err.message,
          username: req.body.username,
          email: req.body.email
        }
      );
	  }
	  passport.authenticate('local')(req, res, () =>{
			res.redirect('/'); 
	  });
	});
});

router.get('/login', (req, res) => {
	res.render('users/login', {title: 'User Login', page: 'login'});
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) { 
    	req.flash('error', 'Incorrect username or password')
    	return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      let redirectTo = req.session.redirectTo ? req.session.redirectTo : '/';
      delete req.session.redirectTo;
      req.flash('success', 'Successfully logged in!');
      res.redirect(redirectTo);
    });
  })(req, res, next);
});

router.get('/profile', isLoggedIn, asyncMiddleware(async (req, res, next) => {
  // // use currentUser unless need more info about user
  // let user = User.findById(req.user._id);
  res.render('users/profile', {title: 'User Profile'});
}));

router.get('/logout', (req, res) => {
 req.logout();
 req.flash('success', 'See you next time!');
 res.redirect('/');
});

module.exports = router;
