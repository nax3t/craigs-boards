const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/user');
const configAuth = require('./auth');

module.exports = (passport) => {

  // used to serialize the user for the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });

  // =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  passport.use('local-signup', new LocalStrategy({
    passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
  },
  (req, username, password, done) => {

    // asynchronous
    process.nextTick(() => {

      //  Whether we're signing up or connecting an account, we'll need
      //  to know if the username address is in use.
      User.findOne({ 'local.username' :  username }, (err, existingUser) => {

        // if there are any errors, return the error
        if (err)
          return done(err);

        // check to see if there's already a user with that username
        if (existingUser) 
          return done(null, false, req.flash('error', 'That username is already taken.'));

        //  If we're logged in, we're connecting a new local account.
        if(req.user) {
          var user            = req.user;
          user.local.username = username;
          user.local.email    = req.body.email;
          user.local.password = user.generateHash(password);
          user.save(function(err) {
            if (err)
              throw err;
            return done(null, user);
          });
        } else {
          //  We're not logged in, so we're creating a brand new user.
          var newUser            = new User();
          newUser.local.username = username;
          newUser.local.email    = req.body.email;
          newUser.local.password = newUser.generateHash(password);

          newUser.save(function(err) {
              if (err)
                  throw err;

              return done(null, newUser);
          });
        }

      });
    });

  }));

  // =========================================================================
  // LOCAL LOGIN =============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-login', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with username
      usernameField : 'username',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
  },
  (req, username, password, done) => { // callback with username and password from our form
      // find a user whose username is the same as the forms username
      // we are checking to see if the user trying to login already exists
      User.findOne({ 'local.username' :  username }, (err, user) => {
          // if there are any errors, return the error before anything else
          if (err)
              return done(err);

          // if no user is found or user found, but password is incorrect, return the message, *changed from 'loginMessage' to 'error'
          if (!user || !user.validPassword(password))
              return done(null, false, req.flash('error', 'Incorrect username or password.')); // req.flash is the way to set flashdata using connect-flash

          // all is well, return successful user
          return done(null, user);
      });

  }));


  // =========================================================================
  // FACEBOOK ================================================================
  // =========================================================================
  var fbStrategy = configAuth.facebookAuth;
  fbStrategy.passReqToCallback = true;  // allows us to pass in the req from our route (lets us check if a user is logged in or not)
  passport.use(new FacebookStrategy(fbStrategy,
  function(req, token, refreshToken, profile, done) {

    // asynchronous
    process.nextTick(function() {

      // check if the user is already logged in
      if (!req.user) {

          User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
              if (err)
                return done(err);

              if (user) {

                  // if there is a user id already but no token (user was linked at one point and then removed)
                  if (!user.facebook.token) {
                    user.facebook.token = token;
                    user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                    user.facebook.email = (profile.emails[0].value || '').toLowerCase();

                    user.save(function(err) {
                      if (err)
                        return done(err);
                          
                      return done(null, user);
                    });
                  }

                  return done(null, user); // user found, return that user
              } else {
                  // if there is no user, create them
                  var newUser            = new User();

                  newUser.facebook.id    = profile.id;
                  newUser.facebook.token = token;
                  newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                  newUser.facebook.email = (profile.emails[0].value || '').toLowerCase();

                  newUser.save(function(err) {
                    if (err)
                      return done(err);
                        
                    return done(null, newUser);
                  });
              }
          });

      } else {
          // user already exists and is logged in, we have to link accounts
          var user            = req.user; // pull the user out of the session

          user.facebook.id    = profile.id;
          user.facebook.token = token;
          user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
          user.facebook.email = (profile.emails[0].value || '').toLowerCase();

          user.save(function(err) {
            if (err)
              return done(err);
                
            return done(null, user);
          });

      }
    });

  }));

}
