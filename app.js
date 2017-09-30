require('dotenv').config()

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const expressSanitizer = require("express-sanitizer");
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;
const methodOverride = require("method-override");
const engine = require('ejs-mate');
const User = require('./models/user');
const configAuth = require('./config/auth'); // is this needed?
const seedDB = require('./seeds');

const index 		= require('./routes/index');
const posts 		= require('./routes/posts');
const comments  = require('./routes/comments');

const app = express();

// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

const databaseUri = process.env.DATABASE_URI || 'mongodb://localhost/cb_dev';

mongoose.connect(databaseUri, { useMongoClient: true })
      .then(() => console.log(`Database connected`))
      .catch(err => console.log(`Database connection error: ${err.message}`));

// Seed the database
seedDB();

// view engine and layout-templates setup
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(flash());
//require moment
app.locals.moment = require('moment');

// PASSPORT CONFIGURATION
app.use(require('express-session')({
    secret: 'Super duper secret secret!',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   // assign local variable page so we don't have to test
   // if page exists (is not undefined) in the nav partial
   res.locals.page = '';
   // define default title if no title is assigned in res.render()
   res.locals.title = 'Craig\'s Boards';
   
   next();
});

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   next();
});

app.use('/', index);
app.use('/posts', posts);
app.use('/posts/:id/comments', comments);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
