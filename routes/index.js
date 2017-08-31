const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', page: 'home' });
});

router.get('/signup', function(req, res) {
  res.render('users/signup', {title: 'User Sign-up', username: '', email: ''});
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
	res.render('users/login', {title: 'User Login'});
});

router.post('/login', passport.authenticate('local', 
  {
    successRedirect: '/',
    failureRedirect: '/login',
    successFlash: 'Welcome to Craig\'s Boards!',
    failureFlash: true
  }), function(req, res){
});

router.get('/logout', function(req, res){
 req.logout();
 req.flash('success', 'See you next time!');
 res.redirect('/');
});

module.exports = router;
