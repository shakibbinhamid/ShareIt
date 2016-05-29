/*****************************************************************************\
 | Server : controllers/thing.js                                               |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | This is where HTTP service methods are defined for Thing objects.           |
 | node-gcm(https://github.com/ToothlessGear/node-gcm) is being used for push. |
 | These routes are heavily used on the client app.                            |
 \*****************************************************************************/


// Load required packages
var Thing = require('../models/thing');
var User = require('../models/user');
var Lend = require('../models/lend');
var Sell = require('../models/sell');
var Offer = require('../models/offer');
var rest = require('./rest-framework');
var gcm = require('node-gcm');

/**
 *
 *POST /api/things
 *
 *Adds new Thing with the userId = req.user._id
 */
exports.postThings = function (req, res) {
    var setOwner = function(thing, save, post) {
        thing._owner = req.user._id; //set Owner to whoever made POST
        save(post);
    };

    var thing = new Thing(); // thing to add

    if (req.body.lend) {
        var lend = new Lend(req.body.lend);
        lend._thing = thing._id;
        thing._lend = lend._id;
    }

    if (req.body.sell) {
        var sell = new Sell(req.body.sell);
        sell._thing = thing._id;
        thing._sell = sell._id;
    }

    var cb = function(err, object) {
        if (err || !object) rest.sendResponse(res, 400)({message: 'Error: Product added, but could not process the offers!'});
        else {
            User.findById(thing._owner).exec(function(err, owner){
                thing._owner = owner;
                rest.sendResponse(res, 201)({message: 'Thing Added!', data: thing});
            });
        }
    };

    var addLendorSell = function(obj) {
        thing = obj;
        if (lend) {
            lend.save(function(err, obj) {
                if (sell) sell.save(cb);
                else cb(err, obj);
            });
        } else if (sell) {
            sell.save(cb);
        } else cb(null, thing);
    };

    rest.post('Thing', thing, req, res, setOwner, addLendorSell);
};

/**
 *
 *GET /api/things
 *
 *Returns all Things
 *Does NOT check for user id
 */
exports.getThings = function (req, res) {
    var query = {};
    var limit = parseInt(req.query.limit); // limit is set to the query limit

    if (req.query._id)
        query._id = {
            $gt: req.query.thingId
        };

    if (req.query.name) {
        query['$or'] = [{'name' : new RegExp(req.query.name, "i")},
                        {'type' : new RegExp(req.query.name, "i")}];
        //query.name = new RegExp(req.query.name, "i"); // See if the query requires a name match
    }

    if (req.query.category) {
        query.type = new RegExp(req.query.category, "i");
    }

    var queryObj = Thing
                    .find(query)
                    .limit(limit)
                    .sort({_id: 1})
                    .populate('_owner', '-password')
                    .populate('_lend')
                    .populate('_sell');

    rest.get('Thing', queryObj, req, res);
};

/**
 *
 *GET /api/things/:thing_id
 *
 *Returns the Things with Thing._id = req.params.thing_id
 *Does NOT Check for user id
 */
exports.getThing = function (req, res) {
    // Use the Thing model to find a specific Thing
    var query = Thing.findOne({ //Find one object given an id
        _id: req.params.thing_id
    }).populate('_owner','-password')
    .populate('_lend')
    .populate('_sell');

    rest.get('Thing', query, req, res);
};

/**
 *
 *PUT /api/things/:thing_id
 *
 *Updates the Things with Thing._id = req.params.thing_id
 *ONLY owner can edit a Thing
 */
exports.putThing = function (req, res) {
    var query = Thing.findOne({ //Find a product owned by the user with given id
        _owner: req.user._id,
        _id: req.params.thing_id
    });

    var test = function(obj) {
        if (req.body._owner) { //change of ownership detected
            User.findOne({
                _id: req.body._owner
            }, function (err, thing) {
                if (err)  //new owner is invalid, err
                    rest.sendResponse(res, 400)({message: 'New Owner Not Found!'});
                else //new owner found
                    rest.updateObject(req, res, obj.data);
            });
        } else  //just simple updating obj
            rest.updateObject(req, res, obj.data);
    };

    rest.put('Thing', query, req, res, undefined, test);
};

/**
 *
 *DELETE /api/things/:thing_id
 *
 *Updates the Things with Thing._id = req.params.thing_id
 *ONLY owner can delete a Thing
 */
exports.deleteThing = function (req, res) {
    var query = Thing.findOne({ //Find a product owned by the user with given id
        _owner: req.user._id,
        _id: req.params.thing_id
    });

    var deleteIt = function(obj) {
        obj.data.remove(function (err, deleted) {
            if (err) { //Delete Failed
                rest.sendResponse(res, 400)({message: 'ERROR: Cannot Remove Product!'});
            } else { //Delete Successful
                rest.sendResponse(res, 200)({message: obj.message, data: deleted});
            }
        });
    };

    rest.handleQuery(query, rest.sendResponse(res, 400), deleteIt, rest.sendResponse(res, 400), 'ERROR: Cannot Remove Product!', 'Product Removed from List!', req);
};

exports.closeProduct = function (req, res) {
    var query = Thing.findOne({ _id: req.params.thing_id, _owner: req.user._id});

    var close = function (found) {
        var thing = found.data;

        if (thing.closed) rest.sendResponse(res, 400)({message: 'ERROR: Product Already Closed !'});
        else {
            thing.closed = true;
            var message = new gcm.Message({
                collapseKey: 'demo',
                priority: 'high',
                notification: {
                    title: "Product Closed",
                    icon: "ic_launcher",
                    body: req.user.username + " closed his item " + thing.name
                }
            });
            Offer.closingNotify(thing._lend, thing._sell, function(ids){User.notify(ids, message);});
            rest.save(thing, rest.sendResponse(res, 400), rest.sendResponse(res, 200));
        }
    };

    rest.get('Thing', query, req, res, undefined, close);
};
