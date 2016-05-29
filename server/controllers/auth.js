/*****************************************************************************\
 | Server : controllers/auth.js                                                |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | This is the authentication middleware, powered by PassportJS.               |
 | http://passportjs.org                                                       |
 \*****************************************************************************/


// Load required packages
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var User = require('../models/user');

passport.use(new BasicStrategy(
    function (username, password, callback) {
        User.findOne({
            username: username
        }, function (err, user) {
            if (err) {
                return callback(err);
            }

            // No user found with that username
            if (!user) {
                console.log("ERR: User not found with username = " + username);
                return callback(null, false);
            }

            // Make sure the password is correct
            user.verifyPassword(password, function (err, isMatch) {
                if (err) {
                    return callback(err);
                }

                // Password did not match
                if (!isMatch) {
                    console.log("ERR: Password not matched for " + username + " tried " + password);
                    return callback(null, false);
                }

                // Success
                return callback(null, user);
            });
        });
    }
));

exports.isAuthenticated = passport.authenticate('basic', {
    session: false
});
