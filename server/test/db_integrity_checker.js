var should = require('should');
var request = require('supertest');
var config = require('./config-debug');
var mongoose = require('mongoose');
var User = require('../models/user');
var Thing = require('../models/thing');
var Offer = require('../models/offer');
var Lend = require('../models/lend');
var Sell = require('../models/sell');
var PushToken = require('../models/push-token');
var gcm = require('node-gcm');

var sender = new gcm.Sender('AIzaSyCjpqO8gEB6FtzZxbZvc3XQlrjfCG54rlk');

var db = mongoose.connect(config.db.mongodb);

describe('Checking User Integrity', function() {
    this.timeout(15000000);
    it('check for PushToken integrities' ,function (done) {
        checkRefCount(User.find().select('_pushTokens'), PushToken, "_pushTokens", 1, done);
    });
    it('send Push notifications to all the active users' ,function (done) {
        var message = new gcm.Message({
            collapseKey: 'demo',
            priority: 'high',
            notification: {
                title: "Testing",
                icon: "ic_launcher",
                body: "Testing stuff"
            }
        });
        User.find().select('_pushTokens').exec(function(err, users){
            run(users, function(user, cb){
                PushToken.findById(user._pushTokens, function(err, tokens) {
                    sender.send(message, { registrationTokens: tokens.tokens }, 10, function (err, response) {
                        cb();
                    });
                });
            }, done);
        });
    });
});

describe('Checking Thing Integrity', function() {
    this.timeout(15000000);
    it('check for owner for Thing' ,function (done) {
        checkRefCount(Thing.find().select('_owner'), User, "_owner", 1, done);
    });
    it('check for Lend for Thing' ,function (done) {
        checkRefCount(Thing.where("_lend").ne(null).select('_lend'), Lend, "_lend", 1, done);
    });
    it('check for Sell for Thing' ,function (done) {
        checkRefCount(Thing.where("_sell").ne(null).select('_sell'), Sell, "_sell", 1, done);
    });
    it('check for reservations for Thing' ,function (done) {
        checkRefCount(Thing.where("_reservedTo").ne(null).select('_reservedTo'), Offer, "_reservedTo", 1, done);
    });
    it('check for Closed for Thing' ,function (done) {
        checkRefCount(Thing.where("closed").exists(true).where("closed").ne(false).select('_reservedTo'), Offer, "_reservedTo", 1, done);
    });
});

describe('Checking Offer Integrity', function() {
    this.timeout(15000000);
    it('check for sender for offers' ,function (done) {
        checkRefCount(Offer.find().select('_from'), User, "_from", 1, done);
    });
    it('check for receiver for offers' ,function (done) {
        checkRefCount(Offer.find().select('_to'), User, "_to", 1, done);
    });
    it('check for lend for offers that are made to borrow' ,function (done) {
        checkRefCount(Offer.where("_borrow").exists(true).select('_borrow'), Lend, "_borrow", 1, done);
    });
    it('check for sell for offers that are made to buy' ,function (done) {
        checkRefCount(Offer.where("_buy").exists(true).select('_buy'), Sell, "_buy", 1, done);
    });
});

var run = function(list, action, cb) {
    if (list.length === 0 && cb) cb();
    else {
        action(list[0], function(){
            list.shift();
            run(list, action, cb);
        });
    };
};

var checkRefCount = function(query, refModel, prop, c, done) {
    query.exec(function(err, objects){
        run(objects, function(object, cb){
            if (object[prop])
                refModel.count({_id: object[prop]}).exec(function(err, count) {
                    count.should.be.equal(c);
                    cb();
                })
            else cb();
        }, done)
    })
}
