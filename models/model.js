var async = require('async');
var conf = require('../config');
var util = require('util');
var Promise = require('bluebird');
var Sequelize = require('sequelize');
var cloudinary = require('../libs/cloudinary');

Array.prototype.diff = function (a) {
    return this.filter(function (i) {
        return a.indexOf(i) < 0;
    });
};
DestroyTags = function (creative) {
    var creativeTags = creative.getTags();
    var allTags = Model.Tag.findAll();
    return Promise.all([creativeTags, allTags])
        .spread(function (creativeTags, allTags) {
            console.log('CREATIVE FOR TAG', creativeTags);
            var creativeIds = creativeTags.map(function(tag) {return tag.id});
            var allIds = allTags.map(function(tag) {return tag.id});
            var diff = allIds.diff(creativeIds);
            var toDelete = creativeIds.diff(diff);
            console.log(allIds, creativeIds, diff);
            return Model.Tag.destroy({ where: {id: toDelete}});
        });
};

var sequelize = new Sequelize(conf.get('DB:table'), conf.get('DB:user'), conf.get('DB:password'), {
    host: conf.get('DB:host'),
    dialect: 'postgres',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

var Creative = sequelize.define('creative', {
        title: Sequelize.STRING,
        description: Sequelize.TEXT,
        article: Sequelize.TEXT,
        template: Sequelize.TEXT,
        imageLink: Sequelize.STRING,
        videoLink: Sequelize.STRING,
        map: Sequelize.ARRAY(Sequelize.DECIMAL),
        url: Sequelize.STRING,
        publicId: Sequelize.STRING
    },
    {
        hooks: {
            beforeDestroy: function (creative) {
                cloudinary.destroy(creative.url);
                DestroyTags(creative);
            }
        }
    });

var Avatar = sequelize.define('avatar', {
    url: Sequelize.STRING,
    publicId: Sequelize.STRING
});

var Category = sequelize.define('category', {
    name: Sequelize.TEXT
});
var Tag = sequelize.define('tag', {
    name: Sequelize.STRING
});
var User = sequelize.define('user', {
    authId: Sequelize.STRING,
    password: Sequelize.STRING,
    theme: {type: Sequelize.STRING, defaultValue: 'light'},
    language: {type: Sequelize.STRING, defaultValue: 'en'},
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    about: Sequelize.STRING,
    email: {
        type: Sequelize.STRING
    }
});

var Rating = sequelize.define('rating', {
    score: Sequelize.INTEGER
});
var CreativeRating = sequelize.define('CreativeRating', {
    score: Sequelize.INTEGER
});
var UserRating = sequelize.define('user_rating', {
    score: Sequelize.INTEGER
});

var Comment = sequelize.define('comment', {
    body: Sequelize.TEXT
});
var CommentRating = sequelize.define('comment_rating', {});
var Medal = sequelize.define('medal', {
    name: Sequelize.TEXT,
    imageLink: Sequelize.STRING
});

User.hasMany(Creative);

Creative.belongsToMany(Tag, {through: "CreativeTag"});
Tag.belongsToMany(Creative, {through: "CreativeTag"});

Creative.belongsTo(Category);

User.belongsToMany(Medal, {through: "UserMedal"});
Medal.belongsToMany(User, {through: "UserMedal"});

//CreativeRating.belongsTo(User);
User.hasMany(CreativeRating);
Creative.hasMany(CreativeRating);

Creative.hasMany(Comment);
Comment.belongsTo(User);

User.hasOne(Avatar);

CommentRating.belongsTo(User);
Comment.hasMany(CommentRating);

User.hasOne(Avatar);


var Model = {
    Comment: Comment,
    Rating: Rating,
    CommentRating: CommentRating,
    Creative: Creative,
    User: User,
    Medal: Medal,
    Category: Category,
    Tag: Tag,
    Avatar: Avatar,
    CreativeRating: CreativeRating,
    AddScores: function (creatives, ratings) {
        var sums = ratings.map(function (ratings) {
            var sum = 0;
            ratings.forEach(function (rating) {
                sum += rating.score;
            });
            return sum;
        });
        for (var i = 0; i < creatives.length; i++) {
            creatives[i].dataValues.score = sums[i];
        }
        return creatives;
    },
    AddLikables: function (creatives, creativeRatings, user) {
        var alreadyRated = creativeRatings.some(function (creativeRating) {
            //console.log("CRE USER & USER", creativeRating.userId, user.id);
            return creativeRating.userId == user.id;
        });
    },
    AddUsers: function (creatives) {
        var userPromises = creatives.map(function (creative) {
            return Model.User.findById(creative.userId)
        });
        return new Promise(function (resolve, reject) {
            return Promise.all(userPromises).then(function (users) {
                for (var i = 0; i < creatives.length; i++) {
                    creatives[i].dataValues.user = users[i].dataValues;
                    //console.log(users[i].dataValues);
                }
            }).then(function () {
                resolve(creatives)
            });
        })
    },
    AddTags: function (creatives) {
        var tagsPromises = creatives.map(function (creative) {
            return creative.getTags();
        });
        return new Promise(function (resolve, reject) {
            return Promise.all(tagsPromises)
                .then(function (tags) {
                    for (var i = 0; i < creatives.length; i++) {
                        var tagValues = tags[i].map(function (tag) {
                            return tag.dataValues
                        });
                        creatives[i].dataValues.tags = tagValues;
                    }
                }).then(function () {

                    resolve(creatives);
                });
        });
    },
    DestroyTags: DestroyTags
};

sequelize.sync({}).then(function () {
    //return Model.User.create({firstName: 'JOHN', lastName: 'DOE', email: 'roma@roma.roma', password: 'roma', authId: "12345", language:"en", theme: "light"});
    //return Promise.all([
    //        Model.Tag.create({
    //            name: 'bound'
    //        }),
    //        Model.Tag.create({
    //            name: 'unbound'
    //        }),
    //        Model.Creative.create({
    //            title: 'title',
    //            article: 'article'
    //        }), Model.Creative.create({
    //            title: 'title2',
    //            article: 'article2'
    //        }),
    //        Model.CreativeRating.create({
    //            score: -3
    //        }),
    //        Model.User.create({
    //            firstName: 'JOHN',
    //            lastName: 'DOE',
    //            email: 'roma@roma.roma',
    //            password: 'roma',
    //            authId: "12345"
    //        })])
    //    .spread(function (bound, unbound, creative1, creative2, rating, johnny) {
    //        // console.log(johnny);
    //        return [
    //            creative1,
    //            creative1.addTag(bound),
    //            bound.addCreative(creative1),
    //            johnny.addCreative(creative1),
    //            johnny.addCreative(creative2),
    //            creative1.addCreativeRating(rating)
    //        ]
    //    });
});

exports.Model = Model;
