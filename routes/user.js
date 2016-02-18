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

exports.setThemeAndLang = function (req, res) {
    console.log(req.body);
    Model.User.findOne({where: {authId: req.session.user}})
        .then(function (user) {
            if (user) {
                user.theme = req.body.theme;
                user.language = req.body.language;
                return user.save();
            } else {
                res.sendStatus(403);}
        })
        .then(function (user) {
            if (user) {
                res.sendStatus(200)
            }
        });
};