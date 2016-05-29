/*****************************************************************************\
 | Server : models/push-token.js                                               |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | A User has a unique username and a hashed password.                         |
 | It also has a reference to the tokens of its registered push devices.       |
 | Finally, it has an avatar field with a default value.                       |
 | User also has a rating between 0 - 5                                        |
 |                                                                             |
 | It doesn't have refs to its Things.                                         |
 | Things have owner fields which can be queried for a User's things.          |
 |                                                                             |
 | A query to PushToken with _pushTokens will give a list of push device tokens|
 \*****************************************************************************/

// Load required packages
var mongoose = require('mongoose');
var PushToken = require('./push-token');
var bcrypt = require('bcrypt-nodejs');
var gcm = require('node-gcm');

var sender = new gcm.Sender('AIzaSyCjpqO8gEB6FtzZxbZvc3XQlrjfCG54rlk');

var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    _pushTokens: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PushToken'
    },
    avatar: {
        type: String,
        default: 'http://ricandriannon.com/wp-content/uploads/2013/10/SouthParkAvatar-4.jpg'
    },
    rating: {
        count: {
            type: Number,
            default: 0
        },
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        comments: [String]
    }
});

// Before saving a User, if the password has changed, then hash the new password first
UserSchema.pre('save', function (callback) {
    var user = this;

    // Break out if the password hasn't changed
    if (!user.isModified('password')) return callback();

    // Password changed so we need to hash it
    bcrypt.genSalt(5, function (err, salt) {
        if (err) return callback(err);

        bcrypt.hash(user.password, salt, null, function (err, hash) {
            if (err) return callback(err);
            user.password = hash;
            callback();
        });
    });
});

// After saving a User, if it doesn't already have a ref to PushToken, create one
UserSchema.post('save', function (callback) {
    var user = this;
    if (!user._pushTokens)
        new PushToken({_user: user._id}).save(function(err, pushTokens){
            if (!err && pushTokens) {
                user._pushTokens = pushTokens._id;
                user.save(callback);
            }
        });
});

// When a User is deleted from db,
// the corresponding pushTokens are deleted as well
UserSchema.pre('remove', function(next) {
    this.model('PushToken').remove({_user: this._id}, function(err, pushToken){
        next();
    });
});

// User can verify a password before making a callback.
// Used for authentication everywhere.
UserSchema.methods.verifyPassword = function (password, cb) {
    bcrypt.compare(password, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

UserSchema.methods.notify = function (msg, cb) {
    PushToken.findById(this._pushTokens).exec(function(err, tokens){
        if (tokens) {
            sender.send(msg, { registrationTokens: tokens.tokens }, 10, function (err, response) {
                if (err) console.log(err);
                if (response) {console.log(response); if (cb) cb(); }
            });
        }
    });
};

UserSchema.statics.notify = function (id_array, msg, cb) {
    this
    .find({_id: { $in : id_array }})
    .select('_pushTokens')
    .populate('_pushTokens')
    .exec(function(err, users){
        console.log(users.length);
        users.forEach(function(user){
            var tokens = user._pushTokens.tokens;
            if (tokens) {
                sender.send(msg, { registrationTokens: tokens }, 10, function (err, response) {
                    if (err) console.log(err);
                    if (response) {console.log(response); if (cb) cb(); }
                });
            }
        });
    });
};

// Export the User model
module.exports = mongoose.model('User', UserSchema);
