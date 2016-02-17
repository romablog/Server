var cloudinary = require('cloudinary');
var conf = require('../config');

cloudinary.config({
    cloud_name: conf.get('Cloud:name'),
    api_key: conf.get('Cloud:key'),
    api_secret: conf.get('Cloud:secret')
});

exports.uploadToCloudinary = function(path, callback) {
    cloudinary.uploader.upload(path, callback);
};

exports.destroy = function(publicId) {
    cloudinary.uploader.destroy(publicId);
};
