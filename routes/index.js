const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', page: 'home' });
});

router.get('/signup', function(req, res) {
  res.render('users/signup', {title: 'User Sign-up', page: 'signup', username: '', email: ''});
});

router.post('/signup', function(req, res) {
	var newUser = new User({username: req.body.username, email: req.body.email});
	User.register(newUser, req.body.password, function(err, user){
	  if(err){
			// return out of callback and render the signupview with 
			// error message as flash and prefilled form inputs for username and email
	    return res.render('users/signup', {error: err.message, username: req.body.username, email: req.body.email});
	  }
	  passport.authenticate('local')(req, res, function(){
			res.redirect('/'); 
	  });
	});
});

router.get('/login', function(req, res) {
	res.render('users/login', {title: 'User Login', page: 'login'});
});

//handling login logic
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { 
    	req.flash('error', 'Incorrect username or password')
    	return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/';
      delete req.session.redirectTo;
      req.flash('success', 'Successfully logged in!');
      res.redirect(redirectTo);
    });
  })(req, res, next);
});

router.get('/logout', function(req, res){
 req.logout();
 req.flash('success', 'See you next time!');
 res.redirect('/');
});

module.exports = router;
