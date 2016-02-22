var Model = require('../models/model.js').Model;

module.exports = function(req, res, next) {
  req.user = res.locals.user = null;
  if (!req.session.user) {
    return Model.Passport.findOne().then(function(user){
      if (user){
        req.session.user = user.dataValues.user;
        console.log(req.session.user);
        return user.destroy();
      }
      return null;
    }).then(function(){
      return next();
    });
  }
  next();
};