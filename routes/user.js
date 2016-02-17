var Model = require('../models/model.js').Model;

exports.get = function(req, res, next) {
    //var email =  req.body.email;
    var user = req.session.user;
    console.log(user);
    Model.User.findOne({where: {authId: user}})
        .then(function(user) {
            if (user) {
                req.session.user = user.authId;
                res.send(user);
            } else {
                res.sendStatus(403);
            }
        })
};