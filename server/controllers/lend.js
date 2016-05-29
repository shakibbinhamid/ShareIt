/*****************************************************************************\
 | Server : controllers/lend.js                                                |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | This is where HTTP service methods are defined for Lend objects.            |
 | Most of these are unused in the client app.                                 |
 \*****************************************************************************/


// Load required packages
var Lend = require('../models/lend');
var Thing = require('../models/thing');
var rest = require('./rest-framework');

/**
 *
 * POST /api/:thing_id/lend
 *
 * Posts the lend option for a thing
 *
 */
exports.postLend = function(req, res){
    var pre = function(lend, save){
        var query = Thing.findOne({
            _id: req.params.thing_id, // Find one object given an id
            _owner: req.user._id // only owner can post a lend option
        });

        var cb = function(){ // if an object is found this will be done
            lend._thing = req.params.thing_id;
            save();
        };

        rest.get('Thing', query, req, res, undefined, cb);
    };

    rest.post('Lend', new Lend(), req, res, pre);
};

/**
 *
 * GET /api/:thing_id/lend/:lend_id
 *
 * Returns the lend option for a thing
 *
 */
exports.getLend = function (req, res) {
    var query = Lend.find({
        _thing: req.params.thing_id
    });
    rest.get('Lend', query, req, res);
};

/**
 *
 * PUT /api/:thing_id/lend/
 *
 * Updates the lend option for a thing
 *
 */
exports.putLend = function (req, res) {
    var query = Lend.findOne({
        _thing: req.params.thing_id,
        _id: req.params.lend_id
    });
    rest.put('Lend', query, req, res);
};

/**
 *
 * DELETE /api/:thing_id/lend/:lend_id
 *
 * Deletes lend option for a thing
 *
 */
exports.deleteLend = function (req, res) {
    var query = Lend.findOne({
        _thing: req.params.thing_id,
        _id: req.params.lend_id
    });
    var action = function(){
        rest.delete('Lend', query, req, res);
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
