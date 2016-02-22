var registrationRedirectPath = 'http://localhost:8000/app/#/';
var Model = require('../models/model.js').Model;

exports.log = function(req, res) {
    console.log(req.sessionID);
    return Model.Passport.create({
        user: req.user.dataValues.authId
    }).then(function(){
        return res.redirect(registrationRedirectPath)
    })
};