/*****************************************************************************\
 | Server : models/sell.js                                                     |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | A Sell is created when a Thing is posted.                                   |
 | The user will define the price here.                                        |
 |                                                                             |
 | The Thing will have a reference to this Sell object.                        |
 | A Sell will in turn have a reference to the Thing.                          |
 | And will know the price is required                                         |
 |                                                                             |
 | These are deleted when a Thing is deleted                                   |
 \*****************************************************************************/

// Load required packages
var mongoose = require('mongoose');

var SellSchema = new mongoose.Schema({
    _thing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thing',
        required: true
    },
    price: {
        type: Number,
        required: true
    }
});

// Export the Sell model
module.exports = mongoose.model('Sell', SellSchema);
