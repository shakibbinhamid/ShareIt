/*****************************************************************************\
 | Server : controllers/pushToken.js                                           |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | This is where HTTP service methods are defined for PushToken objects.       |
 | Only method allowed is to add pushTokens at the moment                      |
 \*****************************************************************************/


// Load required packages
var User = require('../models/user');
var PushToken = require('../models/push-token');
var rest = require('./rest-framework');

exports.putPushToken = function (req, res) {
    User.findById(req.user._id).select('_pushTokens')
    .exec(function(err, user) {
        PushToken.update(
            {_id: user._pushTokens},
            {$addToSet : { tokens : req.body.token }},
            {safe: true, new : true},
            function(err, model) {
                if (err) console.log(err);
                if (model) res.json(model);
            }
        );
    });
};
