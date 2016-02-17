var Model = require('../models/model.js').Model;

module.exports = function(req, res, next) {
  req.user = res.locals.user = null;
  if (!req.session.user) return next();
    console.log(req.sessionID);
  //Model.User.findOne({where: {email: req.body.email}})
  //    .then(function(user) {
  //      if (user)
  //        req.user = res.locals.user = user.authId ;
  //    });
  next();
};