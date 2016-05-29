/*****************************************************************************\
 | Server : controllers/offer.js                                               |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | This is where HTTP service methods are defined for Offer objects.           |
 | node-gcm(https://github.com/ToothlessGear/node-gcm) is being used for push  |
 \*****************************************************************************/


// Load required packages
var Thing = require('../models/thing');
var Offer = require('../models/offer');
var User = require('../models/user');
var PushToken = require('../models/push-token');
var rest = require('./rest-framework');
var gcm = require('node-gcm');

// API key from Google GCM
var sender = new gcm.Sender('AIzaSyCjpqO8gEB6FtzZxbZvc3XQlrjfCG54rlk');

/**
 *
 * POST /api/:thing_id/offer
 *
 * Posts the offer option for a thing
 *
 */
exports.postOffer = function(req, res){

    var offer = new Offer(req.body);
    var registrationTokens = [];

    var sendPush = function(offer) {

        if (offer) res.status(201).json({message: 'Offer Added!', data: offer});
        else res.status(400).json({message: 'ERROR: Offer Not Added!'});

        // sending push notifications
        User.findById(offer._to).select('+_pushTokens').exec(function(err, to) {
            User.findById(offer._from).exec(function(err, from) {
                // if there both users were found properly
                if (to && from) {
                    // get OP's pushtokens
                    PushToken.findById(to._pushTokens)
                    .exec(function(err, token){
                        // prepare the notification package
                        var message = new gcm.Message({
                            collapseKey: 'demo',
                            priority: 'high',
                            notification: {
                                title: "Offer Made",
                                icon: "ic_launcher",
                                body: from.username + " made a request on your stuff."
                            }
                        });
                        // if there are registered devices, then send push
                        if (token) {
                            sender.send(message, { registrationTokens: token.tokens }, 10, function (err, response) {
                                console.log(err);
                            });
                        }
                    });
                }
            });
        });
    };

    rest.post('Offer', offer, req, res, undefined, sendPush);
};

/**
 *
 * GET /api/:thing_id/offers
 *
 * Returns all the offers for a thing
 *
 */
exports.getAllOffers = function (req, res) {
    var thing_query = Thing.findById(req.params.thing_id);

    var getOffers = function(found) {
        var query = Offer.find().or([{_borrow: found.data._lend}, {_buy: found.data._sell}])
                         .populate('_from', '-password').populate('_to', '-password');
        rest.get('Offer', query, req, res);
    };

    rest.get('Offer', thing_query, req, res, undefined, getOffers);
};

/**
 *
 * GET /api/:thing_id/offer/:offer_id
 *
 * Returns the offer with all its fields populated
 *
 */
exports.getOffer = function(req, res) {
    var query = Offer.findById(req.params.offer_id)
                     .populate('_from', '-password').populate('_to', '-password')
                     .deepPopulate('_borrow _buy _borrow._thing _buy._thing');

    rest.get('Offer', query, req, res);
};

/**
 *
 * POST /api/:thing_id/offer/:offer_id/accept
 *
 * Accepts the offer. Also reserves the thing.
 *
 */
exports.acceptOffer = function(req, res) {
    var query = Offer.findById(req.params.offer_id)
                     .populate('_from', '-password').populate('_to', '-password')
                     .deepPopulate('_borrow _buy _borrow._thing _buy._thing');

    var accept = function(found) {
        var offer = found.data; // the found offer

        // create the thing from either borrow or buy
        var createThing = function(request) {return request._thing;};
        var thing = applyToCorrectOffer(offer, createThing, createThing);

        // accept offer and reserve
        offer.accepted = true;
        offer.declined = false;
        thing._reservedTo = offer._id;

        // carry out the db queries and responses.
        var reserve = function() {
            rest.save(thing, rest.sendResponse(res, 400), notify(res, offer._to.username + " accepted your request on " + thing.name, offer._from));
        };

        if (thing.closed) rest.sendResponse(res, 400)({message: 'ERROR: Product already closed!'});
        else rest.save(offer, rest.sendResponse(res, 400), reserve);
    };

    rest.get('Offer', query, req, res, undefined, accept);
};

exports.declineOffer = function(req, res) {
    var query = Offer.findById(req.params.offer_id)
                     .populate('_from', '-password').populate('_to', '-password')
                     .deepPopulate('_borrow _buy _borrow._thing _buy._thing');

    var decline = function(found) {
        var offer = found.data; // the found offer

        // create the thing from either borrow or buy
        var createThing = function(request) {return request._thing;};
        var thing = applyToCorrectOffer(offer, createThing, createThing);

        // decline offer
        offer.declined = true;
        if (offer.accepted) {
            offer.accepted = false;
        }

        // if the thing was reserved to this offer, remove reservation
        var removeRes = function(request) {
            if (request._thing._reservedTo && request._thing._reservedTo.toString() === offer._id.toString()) {
                request._thing._reservedTo = undefined;
            }
            return request._thing;
        };
        thing = applyToCorrectOffer(offer, removeRes, removeRes);

        // carry out the db queries and responses.
        var removeReservation = function() {
            rest.save(thing, rest.sendResponse(res, 400), notify(res, offer._to.username + " declined your request on " + thing.name, offer._from));
        };

        if (thing.closed) rest.sendResponse(res, 400)({message: 'ERROR: Product already closed!'});
        else rest.save(offer, rest.sendResponse(res, 400), removeReservation);
    };

    rest.get('Offer', query, req, res, undefined, decline);
};

var notify = function (res, msg, usr) {
    return function (thing) {
        rest.sendResponse(res, 200)(thing);
        var message = new gcm.Message({
            collapseKey: 'demo',
            priority: 'high',
            notification: {
                title: "Offer Made",
                icon: "ic_launcher",
                body: msg
            }
        });
        usr.notify(message);
    };
};

// finds whether an offer was to borrow or to buy and responds accordingly
var applyToCorrectOffer = function(offer, brCb, byCb) {
    if (offer._borrow) return brCb(offer._borrow);
    else return byCb(offer._buy);
};
