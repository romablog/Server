var Model = require('../models/model.js').Model;
var Promise = require('bluebird');

AddUsers =
    function (comments) {
        return Promise.all([comments, Promise.all(comments.map(function (comment) {
            return comment.getUser()
        }))]).spread(function (comments, users) {
            var result = [];
            for (var i = 0; i < comments.length; i++) {
                comments[i].dataValues.user = users[i].dataValues;
                result.push(comments[i].dataValues);
            }
            return result;
        });
    };
exports.post = function (req, res) {
    console.log("BEFORE EVERYTHING", req.body);
    var comment = Model.Comment.create({
        body: req.body.body
    });
    var user = Model.User.findOne({
        where: {authId: req.session.user}
    });
    var creative = Model.Creative.findById(req.body.id);
    console.log("BEFORE PROMISE");
    Promise.all([user, creative, comment])
        .spread(function (user, creative, comment) {
            console.log(comment);
            return [comment, user, comment.setUser(user),  creative.addComment(comment)]
        })
        .spread(function (comment,user) {
            if (comment) {
                console.log('USER VALUE',user.dataValues);
                comment.dataValues.user = user.dataValues;
                console.log("FUKKEN SAVED", comment.dataValues);
                res.send(comment.dataValues);
            } else {
                res.sendStatus(403);
            }
        });
};


exports.rateComment = function (req, res) {
    var id = req.body.id;
    var sum = 0;
    var currentUser =
        Model.User.findOne({where: {authId: req.session.user}});
    var currentComment =
        Model.Comment.findById(id);
    var commentRatings =
        currentComment.then(function (comment) {
            return comment.getCommentRatings();
        });
    var userRatings =
        currentUser.then(function (user) {
            return user.getCreativeRatings();
        });

    Promise.all([commentRatings, userRatings, currentUser])
        .spread(function (commentRatings, userRatings, user) {
            var alreadyRated = commentRatings.some(function (commentRating) {
                //console.log("CRE USER & USER", creativeRating.userId, user.id );
                return commentRating.userId == user.id;
            });
            if (alreadyRated) {
                res.sendStatus(403);
            } else {
                return [Model.CommentRating.create({}), currentUser, currentComment];
            }
        })
        .spread(function (commentRating, user, comment) {
            return [user.addCommentRating(commentRating), comment.addCommentRating(commentRating)];
        })
        .then(function () {
            res.sendStatus(200);
        });
};

exports.all = function (req, res) {
    var id = req.body.id;
    console.log(id);

    var creative = Model.Creative.findById(id);
    var comments = creative
        .then(function (creative) {
            return creative.getComments();
        });
    comments
        .then(function (comments) {
            return [comments, Promise.all(comments.map(function (comment) {
                return comment.getUser()
            }))];
        })
        .spread(function (comments, users) {
            var result = [];
            for (var i = 0; i < comments.length; i++) {
                comments[i].dataValues.user = users[i].dataValues;
                result.push(comments[i].dataValues);
            }
            console.log(result);
            res.send(result);
        });
};

exports.like = function (req, res) {
    var id = req.body.id;
    var currentUser =
        Model.User.findOne({where: {authId: req.session.user}});
    var currentComment =
        Model.Comment.findById(id);
    var likes =
        currentComment.then(function (comment) {
            return comment.getCommentRatings();
        });
    var users =
        likes.then(function (likes) {
            return Promise.all(likes.map(function (like) {
                return like.getUser();
            }));
        });

    Promise.all([likes, users, currentUser])
        .spread(function (likes, users, user) {

            var alreadyRated = users.some(function (item) {
                //console.log("CRE USER & USER", creativeRating.userId, user.id );
                return item.id == user.id;
            });
            if (alreadyRated) {
                res.sendStatus(403);
            } else {
                return [Model.CommentRating.create({}), user, currentComment];
            }
        })
        .spread(function (like, user, comment) {
            return [like.setUser(user), comment.addCommentRating(like)];
        });
};