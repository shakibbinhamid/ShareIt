/*****************************************************************************\
 | Server : models/push-token.js                                               |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | A Thing has a name, type, description                                       |
 | Its pictures are base64 Strings.                                            |
 |                                                                             |
 | It can be posted for either lending or selling.                             |
 | The details for such trade options are kept at Lend/Sell models.            |
 | Things have refs to their own Lend/Sell objects.                            |
 |                                                                             |
 | It also carries timestamps to keep track of when it's posted.               |
 |                                                                             |
 | A Thing can also be reserved to an "OFFER". It is an intermediary step.     |
 | A Thing is closed when the transaction is successfully carried out.         |
 |                                                                             |
 | Finally, _owner is a ref to the User who called POST on a Thing.            |
 \*****************************************************************************/

// Load required packages
var mongoose = require('mongoose');
var Lend = require('./lend');
var Sell = require('./sell');

var ThingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: String,
    desc: String,
    _owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pictures: [String],
    _lend: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lend'
    },
    _sell: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sell'
    },
    _reservedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer'
    },
    closed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps : true
});

// When a Thing is deleted from db,
// the corresponding trading options are deleted as well
ThingSchema.post('remove', function(doc) {
    if (doc._lend){
        new Lend({_id: doc._lend}).remove();
    }
    if (doc._sell){
        new Sell({_id: doc._sell}).remove();
    }
});

// Export the Thing model
module.exports = mongoose.model('Thing', ThingSchema);
