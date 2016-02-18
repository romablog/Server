var Model = require('../models/model.js').Model;
var Promise = require('bluebird');
var cloudinary = require('../libs/cloudinary');
var fs = require('fs');

exports.post = function (req, res) {

    var path = process.env.HOME + req.session.user + '.jpg';
    var buff = new Buffer(req.body.img.replace(/^data:image\/(png|gif|jpeg);base64,/, ''), 'base64');
    fs.writeFile(path, buff);
    var creative = new Promise(function(resolve, reject){
        cloudinary.uploadToCloudinary(path, function(upload) {
            fs.unlink(path);
            resolve(upload);
        });
    }).then(function (upload) {
        console.log(upload);
        return Model.Creative.create({
            title: req.body.title,
            description: req.body.description,
            template: req.body.template,
            article: req.body.article,
            videoLink: req.body.videoLink,
            map: req.body.map,
            url: upload.url,
            publicId: upload.public_id
        });
    });

    var user = Model.User.findOne({
        where: {authId: req.session.user}
    });

    var tag_array = Promise.all(req.body.tags.map(function (tag) {
        return Model.Tag.findOrCreate({
            where: {name: tag.name},
            defaults: {name: tag.name}
        })
    }));

    Promise.all([user, creative, tag_array])
        .spread(function (user, creative, tag_array) {
            var tags = tag_array.map(function (tag_entry) {
                return tag_entry[0]
            });
            return [
                creative.addTags(tags),
                user.addCreative(creative)]
        })
        .spread(function (creative, user) {
            if (creative && user) {
                res.sendStatus(200);
            } else {
                res.sendStatus(403);
            }
        });
};


exports.allForUser = function (req, res) {
    Model.User.findById(req.params.id)
        .then(function (user) {
        return user.getCreatives()
    }).then(function (creatives) {
        return [creatives, Promise.all(creatives.map(function (creative) {
            return creative.getCreativeRatings();
        }))];
    }).spread(
        Model.AddScores
    ).then(
        Model.AddTags
    ).then(function (creatives) {
        res.send(creatives);
    }, function () {
        res.sendStatus(403);
    });
};

exports.getSpecificPost = function(req, res) {
    var creativeId = req.body.id;
    Model.Creative.findById(creativeId)
        .then(function(post) {
            res.send(post);
        });

};