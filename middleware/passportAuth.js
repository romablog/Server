var Model = require('../models/model.js').Model;
var passport = require('passport');
var StrategyFB = require('passport-facebook').Strategy;
var StrategyTW = require('passport-twitter').Strategy;
var StrategyVK = require('passport-vkontakte').Strategy;
var config = require('../config');


passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new StrategyFB({
        clientID: config.get('FB:appId'),
        clientSecret: config.get('FB:appSecret'),
        callbackURL: config.get('FB:callbackUrl')
    }, function (token, tokenSecret, profile, done) {
    Model.User.findOrCreate({where: {authId: profile.id}, defaults: {authId: profile.id, firstName: profile.displayName}})
        .spread(function (user, created) {
            return done(null, user);
        });
}));

passport.use(new StrategyTW({
        consumerKey: config.get('TW:appId'),
        consumerSecret: config.get('TW:appSecret'),
        callbackURL:  config.get('TW:callbackUrl')
    }, function (token, tokenSecret, profile, done) {
    Model.User.findOrCreate({where: {authId: profile.id.toString()}, defaults: {authId: profile.id.toString(), firstName: profile.displayName}})
        .spread(function (user, created) {
            if (created){
                return Model.Avatar.findOrCreate({where: {url: profile._json.profile_image_url}}).spread(function(avatar, created){
                    if (created){
                        return user.setAvatar(avatar)
                    }
                    return null;
                }).then(function(){
                    return done(null, user);
                });
            }
            return done(null, user);
        });
}));

passport.use(new StrategyVK({
    clientID: config.get('VK:appId'),
    clientSecret: config.get('VK:appSecret'),
    callbackURL:  config.get('VK:callbackUrl')
},function (token, tokenSecret, profile, done) {
    Model.User.findOrCreate({where: {authId: profile.id.toString()}, defaults: {authId: profile.id.toString(), firstName:profile._json.first_name, lastName:profile._json.last_name}})
        .spread(function (user, created) {
            if (created){
                return Model.Avatar.findOrCreate({where: {url: profile._json.photo}}).spread(function(avatar, created){
                    if (created){
                        return user.setAvatar(avatar)
                    }
                    return null;
                }).then(function(){
                    return done(null, user);
                });
            }
            return done(null, user);
        });
}));