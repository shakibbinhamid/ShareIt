/*****************************************************************************\
 | Server : models/lend.js                                                     |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | An Offer is a request from a User to another User to Borrow or Buy a Thing. |
 | These are considered a response to Lend or Sell of a Thing.                 |
 |                                                                             |
 | Making an offer to one self will fail                                       |
 |                                                                             |
 | Offers have timestamps to keep track.                                       |
 | Offers do not disappear when a Thing is deleted.                            |
 |                                                                             |
 | Offers can be accepted. Offer.accepted => thing.reserved                    |
 |                                                                             |
 | !accepted && !thing.closed => ongoing item. just normal.                    |
 |                        can post another offer, but this one is declined     |
 | !accepted && thing.closed => item gone.                                     |
 |                            offer recorded as declined on account            |
 | accepted && !thing.closed => item._reservedTo = _from .                     |
 |                            Offer is on the way to be successful.            |
 | accepted && thing.closed => item._reservedTo = _from .                      |
 |                            Offer is complete and successful.                |
 |                                                                             |
 | accepted === !declined                                                      |
 |                                                                             |
 | Things do not have a reference to their Offers.                             |
 | Offers only record the Lend/Sell option, from which the Thing can be found. |
 \*****************************************************************************/

// Load required packages
var mongoose = require('mongoose');
var Thing = require('./thing');
var Lend = require('./lend');
var Sell = require('./sell');
var User = require('./user');

var OfferSchema = new mongoose.Schema({
    _from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    _to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            validator: function(v) {
                return !this._from.equals(v);
            },
            message: 'Cannot make offer to self!'
        }
    },
    _borrow: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lend'
    },
    _buy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sell'
    },
    reason: String,
    accepted: {
        type: Boolean,
        default: false
    },
    declined: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// An Offer checks for the existence of the User everytime it is made.
OfferSchema.pre('save', function (next) {
    testForObject(User.findById(this._from), next);
});

// An Offer checks for the existence of the User everytime it is made.
OfferSchema.pre('save', function (next) {
    testForObject(User.findById(this._to), next);
});

// An Offer checks for the existence of the trade options everytime it is made.
OfferSchema.pre('save', function (next) {
    if (this._borrow) testForObject(Lend.findById(this._borrow), next);
    else next();
});

// An Offer checks for the existence of the trade options everytime it is made.
OfferSchema.pre('save', function (next) {
    if (this._buy) testForObject(Sell.findById(this._buy), next);
    else next();
});

OfferSchema.statics.closingNotify = function (lend_id, sell_id, cb) {
    this
    .find({ $or : [{_borrow: lend_id}, {_buy: sell_id}]})
    .exec(function(err, offers){
        var froms = offers.map(function(offer){return offer._from;});
        cb(froms);
    });
};

// tests if a query returns an object from db
var testForObject = function (query, next) {
    query.exec(function(err, obj){
        if (!err && obj) next();
        else next(new Error("ERROR OR NOT FOUND"));
    });
};

// Export the Mongoose model
module.exports = mongoose.model('Offer', OfferSchema);

var deepPopulate = require('mongoose-deep-populate')(mongoose);
OfferSchema.plugin(deepPopulate);
