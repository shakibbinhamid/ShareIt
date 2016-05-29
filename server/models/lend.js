/*****************************************************************************\
 | Server : models/lend.js                                                     |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | A Lend is created when a Thing is posted.                                   |
 | The user will define what he requires to lend the object here.              |
 |                                                                             |
 | The Thing will have a reference to this Lend object.                        |
 | A Lend will in turn have a reference to the Thing.                          |
 | It will also know when the Thing is available for borrowing (default today).|
 | And will know how much deposit is required (if any).                        |
 |                                                                             |
 | These are deleted when a Thing is deleted                                   |                  |
 \*****************************************************************************/

// Load required packages
var mongoose = require('mongoose');

var LendSchema = new mongoose.Schema({
    _thing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thing',
        required: true
    },
    deposit: Number,
    from: {
        type: Date,
        default: Date.now
    },
    to: Date
});

// Export the Lend model
module.exports = mongoose.model('Lend', LendSchema);
