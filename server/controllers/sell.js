/*****************************************************************************\
 | Server : controllers/sell.js                                                |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | This is where HTTP service methods are defined for Sell objects.            |
 | These are not used in the client.                                           |
 \*****************************************************************************/


// Load required packages
var Sell = require('../models/sell');
var Thing = require('../models/thing');
var rest = require('./rest-framework');

/**
 *
 * POST /api/:thing_id/sell
 *
 * Posts the sell option for a thing
 *
 */
exports.postSell = function(req, res){
    var pre = function(sell, save){
        var query = Thing.findOne({
            _id: req.params.thing_id, // Find one object given an id
            _owner: req.user._id // only owner can post a sell option
        });

        var cb = function(){ // if an object is found this will be done
            sell._thing = req.params.thing_id;
            save();
        };

        rest.get('Thing', query, req, res, undefined, cb);
    };

    rest.post('Sell', new Sell(), req, res, pre);
};

/**
 *
 * GET /api/:thing_id/sell/:sell_id
 *
 * Updates the sell option for a thing
 *
 */
exports.getSell = function (req, res) {
    var query = Sell.find({
        _thing: req.params.thing_id
    });
    rest.get('Sell', query, req, res);
};

exports.putSell = function (req, res) {
    var query = Sell.findOne({
        _thing: req.params.thing_id,
        _id: req.params.sell_id
    });
    rest.put('Sell', query, req, res);
};

/**
 *
 * DELETE /api/:thing_id/sell/:sell_id
 *
 * Deletes sell option for a thing
 *
 */
exports.deleteSell = function (req, res) {
    var query = Sell.findOne({
        _thing: req.params.thing_id,
        _id: req.params.sell_id
    });
    var action = function(){
        rest.delete('Sell', query, req, res);
    };
    var pre = function(object, action){
        var thingQuery = Thing.findOne({
            _id: req.params.thing_id, // thing has to exist
            _owner: req.user._id // only owner can delete
        });
        rest.get('Thing', thingQuery, req, res, undefined, action);
    };
    rest.injectMiddleware(undefined, action, pre);
};
