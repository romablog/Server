var express = require('express');
var path = require('path');
var http = require('http');
var config = require('./config');
var log = require('./libs/log')(module);
var HttpError = require('./error').HttpError;
var favicon = require('serve-favicon');
var errorhandler = require('errorhandler');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var logger = require('morgan');
var pg = require('pg');
var pgSession = require('connect-pg-simple')(session);

var app = express();

if (app.get('env') == 'development') {
  app.use(logger('dev'));
} else {
  app.use(logger('default'));
}
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cookieParser());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  store: new pgSession({
    pg : pg,
    conString : 'postgres://' + config.get('DB:user') + ':' + config.get('DB:password') + '@' +  config.get('DB:host') + ':' + config.get('DB:port') + '/' + config.get('DB:table'),
    tableName : 'session'
  }),
  secret: config.get('session:secret'),
  key: config.get('session:key'),
  resave: true,
  saveUninitialized: true
}));
require('./libs/cronJobForElastic');
require('./middleware/passportAuth');

app.use(passport.initialize());
app.use(passport.session());
app.use(require('./middleware/loadUser'));
app.use(require('./middleware/sendHttpError'));
app.use(require('./middleware/originPermission'));
require('./routes')(app);

app.use(function(err, req, res, next) {
  if (typeof err == 'number') {
    err = new HttpError(err);
  }
  if (err instanceof HttpError) {
    res.sendHttpError(err);
  } else {
    if (app.get('env') == 'development') {
      errorhandler()(err, req, res, next);
    } else {
      log.error(err);
      err = new HttpError(500);
      res.sendHttpError(err);
    }
  }
});

app.listen(config.get('port'), function(){
  log.info('Express server listening on port ' + config.get('port'));
});