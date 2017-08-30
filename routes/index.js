const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/signup', function(req, res) {
  res.render('users/signup', {title: 'User Signup'});
});

router.post('/signup', function(req, res) {
	var newUser = new User({username: req.body.username, email: req.body.email});
	User.register(newUser, req.body.password, function(err, user){
	    if(err){
	        console.log(err);
	        return res.render('users/signup');
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
        failureRedirect: '/login'
    }), function(req, res){
});

router.get('/logout', function(req, res){
   req.logout();
   res.redirect('/');
});

module.exports = router;
