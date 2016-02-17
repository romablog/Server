var Model = require('../models/model.js').Model;
var uuid = require('uuid');

exports.post = function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var surname = req.body.surname;
    var about = req.body.about;
    var theme = req.body.theme;
    var language = req.body.language;
    Model.User.create({
        authId: uuid.v1(),
        theme: theme,
        language: language,
        firstName: username,
        lastName: surname,
        email: email,
        about: about,
        password: password
    }). then(function(user){
        req.session.user = user.authId;
        res.send(user)
    });
};