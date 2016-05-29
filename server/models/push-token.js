/*****************************************************************************\
 | Server : models/push-token.js                                               |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | A PushToken keeps track of the registered device tokens for a User.         |
 | This is done to keep the tokens separated and never send to the Client.     |
 \*****************************************************************************/

// Load required packages
var mongoose = require('mongoose');

// A PushToken keeps track of the registered device tokens for a User.
// This is done to keep the tokens separated and never send to the Client.

var PushTokenSchema = new mongoose.Schema({
    _user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tokens: [String]
});

// Export the PushToken model
module.exports = mongoose.model('PushToken', PushTokenSchema);
