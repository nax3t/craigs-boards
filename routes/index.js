const express = require('express');
const router = express.Router();
const middleware = require('../middleware');
const { asyncMiddleware, isLoggedIn } = middleware;
const {
  index,
  getSignup, 
  postSignup, 
  getLogin, 
  postLogin, 
  getProfile, 
  logout, 
  update, 
  getFbAuth, 
  getFbAuthCb, 
  getConnectLocal,
  postConnectLocal,
  connectFbCb,
  unlinkLocal,
  unlinkFb,
  getForgot,
  postForgot,
  getResetToken,
  postResetToken
} = require('../middleware/users');

router.get('/', index);

router.get('/signup', getSignup);

router.post('/signup', postSignup);

router.get('/login', getLogin);

router.post('/login', postLogin);

router.get('/profile', isLoggedIn, asyncMiddleware(getProfile));

router.get('/logout', logout);

router.put('/users', update);

router.get('/auth/facebook/:action', getFbAuth);

router.get('/auth/facebook/callback/login', getFbAuthCb);

router.get('/connect/local', isLoggedIn, getConnectLocal);

router.post('/connect/local', postConnectLocal);

router.get('/auth/facebook/callback/connect', isLoggedIn, connectFbCb);

router.get('/unlink/local', isLoggedIn, asyncMiddleware(unlinkLocal));

router.get('/unlink/facebook', isLoggedIn, asyncMiddleware(unlinkFb));

router.get('/forgot', getForgot);

router.post('/forgot', postForgot);

router.get('/reset/:token', getResetToken);

router.post('/reset/:token', postResetToken);

module.exports = router;
