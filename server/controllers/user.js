/*****************************************************************************\
 | Server : controllers/user.js                                                |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | This is where HTTP service methods are defined for User objects.            |
 \*****************************************************************************/


// Load required packages
var User = require('../models/user');
var Thing = require('../models/thing');
var Offer = require('../models/offer');
var rest = require('./rest-framework');

/**
 *
 *POST /api/users
 *
 *If there is no user with given username, then creates an account
 *
 */
exports.postUsers = function (req, res) {
    var user = new User({
        username: req.body.username,
        password: req.body.password,
        avatar: req.body.avatar
    });

    var query = User.findOne({
        username: user.username
    });

    var saveUser= function (errmsg) {
        user.save(function (err, usr) {
            if (err)
                rest.sendResponse(res, 400)({ message: errmsg }); // error occured while saving
            else
                rest.sendResponse(res, 201)({ //Successfully added user
                    message: 'New user added!',
                    data: usr
                });
        });
    };

    rest.handleQuery(query, rest.sendResponse(res, 400), rest.sendResponse(res, 400), saveUser, "Username Exists!", "Username already exists! Please choose another", req);
};

/**
 *
 *GET /api/users
 *
 *Returns all the users
 *
 */
exports.getUsers = function (req, res) {
    var query = User.find();
    rest.get('User', query, req, res);
};

/**
 *
 *GET /api/users/:username
 *
 *Returns all the user given username
 *
 */
exports.getUser = function (req, res) {
    var query = User.findOne({
        username : req.params.username
    });
    rest.get('User', query, req, res);
};

/**
 *
 *GET /api/users/:username/things
 *
 *Returns all the user's  given username
 *
 */
exports.getUserThings = function (req, res) {
    var query = User.findOne({
        username : req.params.username
    });
    rest.get('User', query, req, res, undefined, sendUserThings(res));
};

/**
 *
 * PUT /api/users/:username/
 *
 * Updates the user  given username
 *
 */
exports.putUser = function (req, res) {
    var query = User.findOne({ //Find a product owned by the user with given id
        _id: req.user._id,
        username: req.params.username
    });
    rest.put('User', query, req, res);
};

/**
 *
 * PUT /api/users/:username/rating
 *
 * Updates the user's rating given the new rating = {rating : Number}
 *
 */
exports.putUserRating = function (req, res) {
    var query = User.findOne({
        username: req.params.username
    });
    if (req.body.rating.rating > 0) { // cannot give a rating of 0 or undefined
        var rateUser = function(obj) {
            var user = obj.data;

            //calculate the new average and save
            user.rating.average = ((user.rating.average * user.rating.count) + req.body.rating.rating) / ++user.rating.count;
            if (req.body.rating.comment) user.rating.comments.push(req.body.rating.comment);
            rest.save(user, rest.sendResponse(res, 400), rest.sendResponse(res, 200));
        };
        rest.put('User', query, req, res, undefined, rateUser, undefined);
    } else {
        rest.sendResponse(res, 400)({message: "Sorry, cannot rate that!"});
    }
};

/**
 *
 * GET /api/users/:username/offers
 *
 * Updates all the offers made to the person
 *
 */
exports.getAllOffers = function (req, res) {
    var query = Offer.find({_to : req.user._id})
                     .populate('_from', '-_pushTokens -password')
                     .deepPopulate('_borrow _buy _buy._thing');

    var cb = function(obj){
        for(var i=0; i<obj.data.length; i++){
            if (obj.data[i]._borrow) {
                obj.data[i]._borrow._thing.pictures = undefined;
            } else {
                obj.data[i]._buy._thing.pictures = undefined;
            }
        }
        rest.sendResponse(res, 200)(obj);
    };
    rest.get('Offer', query, req, res, undefined, cb);
};

/**
* Finds a user's things
* returns function (x) -> rest.handleQuery(...)
* Gets called after a query resolved to a User, then requests to resolve the user's Things
*/
var sendUserThings = function(res) {
    var resFunc = function(obj){
        if (obj.data) {
            var query = Thing.find({_owner: obj.data._id}).populate('_owner');
            rest.handleQuery(query, rest.sendResponse(res), rest.sendResponse(res), rest.sendResponse(res), "ERROR: Products Not Found!", "Products Found!");
        }
    };
    return resFunc;
};
