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

          // if no user is found, return the message
          if (!user)
              return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

          // if the user is found but the password is wrong
          if (!user.validPassword(password))
              return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

          // all is well, return successful user
          return done(null, user);
      });

  }));


  // =========================================================================
  // FACEBOOK ================================================================
  // =========================================================================
  let fbStrategy = configAuth.facebookAuth;
  fbStrategy.passReqToCallback = true;  // allows us to pass in the req from our route (lets us check if a user is logged in or not)
  passport.use(new FacebookStrategy(fbStrategy,
  (req, token, refreshToken, profile, done) => {
  // facebook will send back the token and profile

    // asynchronous
    process.nextTick(() => {

      // check if the user is already logged in
      if (!req.user) {
          // find the user in the database based on their facebook id
          User.findOne({ 'facebook.id' : profile.id }, (err, user) => {
              // if there is an error, stop everything and return that
              // ie an error connecting to the database
              if (err)
                  return done(err);
              // if the user is found, then log them in
              if (user) {
                  // if there is a user id already but no token (user was linked at one point and then removed)
                  // just add our token and profile information
                  if (!user.facebook.token) {
                      user.facebook.token = token;
                      user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                      user.facebook.email = (profile.emails[0].value || 'no facebook email').toLowerCase();

                      user.save((err) => {
                          if (err)
                              throw err;
                          return done(null, user);
                      });
                  }

                  return done(null, user); // user found, return that user
              } else {
                  // if there is no user found with that facebook id, create them
                  var newUser            = new User();

                  // set all of the facebook information in our user model
                  newUser.facebook.id    = profile.id; // set the users facebook id                   
                  newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
                  newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                  newUser.facebook.email = (profile.emails[0].value || 'no facebook email').toLowerCase(); // facebook can return multiple emails so we'll take the first

                  // save our user to the database
                  newUser.save((err) => {
                    if (err)
                      throw err;

                    // if successful, return the new user
                    return done(null, newUser);
                  });
              }

          });

      } else {
          // user already exists and is logged in, we have to link accounts
          var user            = req.user; // pull the user out of the session

          // update the current users facebook credentials
          user.facebook.id    = profile.id;
          user.facebook.token = token;
          user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
          user.facebook.email = (profile.emails[0].value || 'no facebook email').toLowerCase();

          // save the user
          user.save((err) => {
            if (err)
              throw err;
            return done(null, user);
          });
      }

    });

  }));
}