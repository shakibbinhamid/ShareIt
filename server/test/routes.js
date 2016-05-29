var should = require('should');
var assert = require('assert');
var request = require('supertest');
var mongoose = require('mongoose');
var config = require('./config-debug');
var User = require('../models/user');
var Thing = require('../models/thing');
var Offer = require('../models/offer');
var PushToken = require('../models/push-token');

var developmentMode = true;

var getUrl = function(developmentMode, username, password) {
    var PROTOCOL = "http://";
    var HOST = "";
    if (developmentMode) HOST = "localhost:3000";
    else HOST = "project-api.herokuapp.com";
    if (username && password)
        return PROTOCOL + username + ':' + password + '@' + HOST;
    else
        return PROTOCOL + HOST;
};

var routes = {
    users : '/api/users/',
    things : '/api/things/',
    user : function (id) {return this.users + id + '/'},
    thing : function (id) {return this.things + id + '/'},
    offers : function (thing_id) {return this.thing(thing_id) + 'offers/'},
    offer : function (thing_id, id) {return this.offers(thing_id) + id + '/'},
    accept : function (thing_id, id) {return this.offer(thing_id, id) + 'accept/'},
    decline : function (thing_id, id) {return this.offer(thing_id, id) + 'decline/'},
    close : function (id) {return this.thing(id) + 'close/'}
};

describe('Routing', function() {

    // set up db before any test
    before(function(done) {
    // In our tests we use the test db
        mongoose.connect(config.db.mongodb);
        done();
    });

    // Tests related to user accounts
    describe('User Account', function() {

        // this is the object that will be used to create a user and checked against
        var _id = '';
        var username = 'bob';
        var password = 'test';
        var avatar = 'http://vignette1.wikia.nocookie.net/southpark/images/3/3f/South_Park_Avatar_Wallpaper800x600.png/revision/latest?cb=20111107043648';

        // TEST : Try to post a user without a username
        it('should not post a new user without a username', function(done) {
            // this user doesn't have a username
            var invalidPerson = {
                username : '',
                password : 'test'
            };
            request(getUrl(developmentMode)) // request
        	.post(routes.users) // to POST @ /api/users
        	.send(invalidPerson) // send user object without username
        	.end(function(err, res) {
                if (err) throw err;

                res.status.should.be.equal(400); // should send HTTP 400
                (typeof res.body.data).should.be.equal('undefined'); // doesn't return data

                done();
            });
        });

        // TEST : Try to post a user without a password
        it('should not post a new user without a password', function(done) {
            // this user doesn't have a password
            var invalidPerson = {
                username : 'bob',
                password : ''
            };
            request(getUrl(developmentMode)) // request
        	.post(routes.users) // to POST @ /api/users
        	.send(invalidPerson) // send user object without username
        	.end(function(err, res) {
                if (err) throw err;

                res.status.should.be.equal(400); // should send HTTP 400
                (typeof res.body.data).should.be.equal('undefined'); // doesn't return data

                done();
            });
        });

        // TEST : Try to post a new user
        it('should successfully post a new user', function(done) {
            request(getUrl(developmentMode)) // request
        	.post(routes.users) // to POST @ /api/users
        	.send({
                username : username,
                password : password,
                avatar : avatar
            }) // send in {bob, test} as a user
        	.end(function(err, res) {
                if (err) throw err;
                var person = res.body.data;

                person.should.have.property('_id');
                _id = person._id;

                person.should.have.property('username');
                person.username.should.be.equal(username);
                person.should.have.property('avatar');
                person.avatar.should.be.equal(avatar);

                done();
            });
        });

        // TEST : Try to post a new user with the same username
        it('should return error trying to save duplicate username', function(done) {
            request(getUrl(developmentMode)) // request
        	.post(routes.users) // to POST @ /api/users
        	.send({
                username : username,
                password : 'test1',
                avatar : 'test1'
            }) // send in {bob, test1} as a user
        	.end(function(err, res) {
                if (err) throw err;

                res.status.should.be.equal(400); // should give HTTP 400

                var person = res.body.data;

                person.should.have.property('_id');
                person._id.should.be.equal(_id);
                person.should.have.property('username');
                person.username.should.be.equal(username);

                done();
            });
        });

        // TEST : Try to get user just created and check fields
        it('should return a correct user', function(done) {
            request(getUrl(developmentMode, username, password)) // request
        	.get(routes.user(username)) // to GET @ /api/users/bob
        	.end(function(err, res) {
                if (err) throw err;
                var person = res.body.data;

                res.status.should.be.equal(200);
                person.should.have.property('username');
                person.username.should.be.equal(username);
                person.should.have.property('_id');
                person._id.should.be.equal(_id);
                person.should.have.property('avatar');
                person.avatar.should.be.equal(avatar);

                done();
            });
        });

        // TEST : Try to edit user
        it('should edit a user', function(done) {
            var editedData = {
                username: 'molly',
                avatar: 'http://40.media.tumblr.com/2b5c21a3cf0b4c3cb18387a4528ea213/tumblr_n2sg0bi0Ub1qimttgo1_500.png'
            };
            request(getUrl(developmentMode, username, password)) // request
        	.put(routes.user(username)) // to PUT @ /api/users/bob
        	.send(editedData) // send in {molly}
        	.end(function(err, res) {
                if (err) throw err;

                var person = res.body.data;

                person.should.have.property('_id');
                person._id.should.be.equal(_id);
                person.should.have.property('username');
                person.username.should.be.equal(editedData.username);
                person.should.have.property('avatar');
                person.avatar.should.be.equal(editedData.avatar);

                username = person.username;
                avatar = person.avatar;

                done();
            });
        });

        // TEST : Try to rate a user
        it('should rate a user', function(done) {
            var rating1 = {
                rating : {
                    rating : 5,
                    comment : 'great rating'
                }
            };
            var rating2 = {
                rating : {
                    rating : 4
                }
            };
            request(getUrl(developmentMode, username, password)) // request
        	.put(routes.users + username + '/rating') // to PUT @ /api/users/molly/rating
        	.send(rating1) // send in {5}
        	.end(function(err, res) {
                if (err) throw err;

                request(getUrl(true, username, password)) // request
            	.put(routes.users + username + '/rating') // to PUT @ /api/users/molly/rating
            	.send(rating2) // send in {4}
            	.end(function(err, res) {
                    if (err) throw err;

                    var person = res.body;

                    person.rating.average.should.be.equal((rating1.rating.rating + rating2.rating.rating) / 2); // should be 4.5
                    person.rating.count.should.be.equal(2); // count should be 2
                    person.rating.comments.length.should.be.equal(1); // there should be exactly 1 comment

                    var rating = res.body.rating.rating;
                    done();
                });
            });
        });
        // clear our the created user for next test
        after(function(done) {
            new User({_id : _id}).remove(function (err, deleted) {
                if (err) throw err
                done();
            });
        });
    });

    // tests for Thing routes
    describe('Thing', function() {
        var password = 'test'; // the password for both users

        // test user 1
        var bob = {
            username: 'bob',
            password: password,
            avatar: 'http://vignette1.wikia.nocookie.net/southpark/images/3/3f/South_Park_Avatar_Wallpaper800x600.png/revision/latest?cb=20111107043648'
        };

        // test user 2
        var mary = {
            username: 'mary',
            password: password,
            avatar: 'http://40.media.tumblr.com/2b5c21a3cf0b4c3cb18387a4528ea213/tumblr_n2sg0bi0Ub1qimttgo1_500.png'
        };

        // this is the Thing that will be posted and checked against
        var thing = {
            name: 'Test Thing',
            type: 'Test Type',
            desc: 'Test Desc',
            lend: {
                deposit: 100
            },
            sell: {
                price: 150
            },
            pictures : ['http://www6.pcmag.com/media/images/402617-surface-pro-4.jpg', 'http://tech.blorge.com/wp-content/uploads/2015/09/Surface-Pro-4.jpg']
        };

        // this is the edited object later in the tests
        var thing2 = {
            name: 'Test Thing 2',
            type: 'Test Type 2',
            desc: 'Test Desc 2',
            pictures : ['http://www.extremetech.com/wp-content/uploads/2015/10/Microsoft-Surface-Pro-4.jpg', 'http://i.gzn.jp/img/2014/07/17/surface-pro3-review/00-top.jpg']
        };

        // create the owner objects
        before(function(done) {
            new User(bob).save(function(err, saved1){
                if (err) throw err;
                new User(mary).save(function(err, saved2){
                    if (err) throw err;
                    saved1.password = password;
                    saved2.password = password;

                    bob = saved1;
                    mary = saved2;
                    done();
                });
            });
        });

        // TEST : Try to fail post a new thing without authorisation
        it('should not create a Thing because not authorisation', function(done){
            request(getUrl(developmentMode)) // request without any username or password
        	.post(routes.things) // to POST @ /api/things
            .send(thing) // send in the thing
        	.end(function(err, res) {
                if (err) throw err;
                res.status.should.be.equal(401); // should give a HTTP 401
                (typeof res.body.data).should.be.equal('undefined'); // doesn't return data
                done();
            });
        });

        // TEST : Try to make BOB post a new thing
        it('should create a new Thing', function(done){
            request(getUrl(developmentMode, bob.username, password)) // request from BOB
        	.post(routes.things) // to POST @ /api/things/
            .send(thing) // send in the thing
        	.end(function(err, res) {

                if (err) throw err;
                var thingTemp = thing;
                thing = res.body.data;
                res.status.should.be.equal(201);
                // ID
                thing.should.have.property('_id');
                // NAME
                thing.should.have.property('name');
                thing.name.should.be.equal(thingTemp.name);
                // DESC
                thing.should.have.property('desc');
                thing.desc.should.be.equal(thingTemp.desc);
                // OWNER = BOB
                thing.should.have.property('_owner');
                (bob._id.equals(thing._owner._id)).should.be.true();
                // PICTURES
                thing.should.have.property('pictures');
                should.deepEqual(thing.pictures, thingTemp.pictures);
                // LEND
                thing.should.have.property('_lend');
                // SELL
                thing.should.have.property('_sell');
                // CLOSED
                thing.should.have.property('closed');
                thing.closed.should.be.false();

                done();
            });
        });

        // TEST : try to get a Thing
        it('should return the created Thing', function(done) {
            request(getUrl(developmentMode, mary.username, password)) // request by MARY
        	.get(routes.thing(thing._id)) // to GET @ /api/things/id
        	.end(function(err, res) {
                if (err) throw err;
                var thingTemp = res.body.data;

                // HTTP 200
                res.status.should.be.equal(200);
                // ID
                thingTemp.should.have.property('_id');
                thingTemp._id.should.be.equal(thing._id);
                // NAME
                thingTemp.should.have.property('name');
                thingTemp.name.should.be.equal(thing.name);
                // DESC
                thingTemp.should.have.property('desc');
                thingTemp.desc.should.be.equal(thing.desc);
                // OWNER
                thingTemp.should.have.property('_owner');
                thingTemp._owner.should.have.property('_id');
                thingTemp._owner._id.should.be.equal(bob._id.toString());
                // PICTURES
                thingTemp.should.have.property('pictures');
                should.deepEqual(thingTemp.pictures, thing.pictures);
                // LEND
                thingTemp.should.have.property('_lend');
                thingTemp._lend.should.have.property('_id');
                thingTemp._lend._id.should.be.equal(thing._lend);
                // SELL
                thingTemp.should.have.property('_sell');
                thingTemp._sell.should.have.property('_id');
                thingTemp._sell._id.should.be.equal(thing._sell);
                // CLOSED
                thingTemp.should.have.property('closed');
                thingTemp.closed.should.be.false();
                done();
            });
        });

        // TEST : Try to update the thing using wrong owner
        it('should not update the Thing if not the owner', function(done) {
            request(getUrl(developmentMode, mary.username, password)) // request by MARY
        	.put(routes.thing(thing._id)) // to PUT @ /api/things/id
            .send(thing2)
        	.end(function(err, res) {
                if (err) throw err;
                res.status.should.be.equal(400); // fail to update the object HTTP 400
                done();
            });
        });

        // TEST : Try to update the thing
        it('should update the Thing', function(done) {
            request(getUrl(true, bob.username, password)) // request by BOB
        	.put(routes.thing(thing._id)) // PUT @ /api/things/id
            .send(thing2) // send in the update object
        	.end(function(err, res) {
                if (err) throw err;
                var thingTemp = res.body.data;

                // ID
                thingTemp.should.have.property('_id');
                thingTemp._id.should.be.equal(thing._id);
                // NAME
                thingTemp.should.have.property('name');
                thingTemp.name.should.be.equal(thing2.name);
                thing.name = thingTemp.name;
                // DESC
                thingTemp.should.have.property('desc');
                thingTemp.desc.should.be.equal(thing2.desc);
                thing.desc = thingTemp.desc;
                // PICTURES
                thingTemp.should.have.property('pictures');
                should.deepEqual(res.body.data.pictures, thing2.pictures);
                // OWNER NOT CHANGED
                thingTemp.should.have.property('_owner');
                thingTemp._owner.should.be.equal(thing._owner._id);

                done();
            });
        });

        // TEST : Try to delete using wrong owner
        it('should not delete the Thing if not owner', function(done) {
            request(getUrl(developmentMode, mary.username, password)) // request by MARY
        	.delete(routes.thing(thing._id)) // to DELETE @ /api/things/id
        	.end(function(err, res) {
                if (err) throw err;
                res.status.should.be.equal(400); // should fail to delete, HTTP 400
                done();
            });
        });

        // clear our the created users and things for next test
        after(function(done) {
            new User(bob).remove(function (err, deleted) {
                if (err) throw err;
                new User(mary).remove(function (err, deleted) {
                    if (err) throw err;
                    new Thing(thing).remove(function (err, deleted) {
                        if (err) throw err;
                        done();
                    });
                });
            });
        });
     });

    // test suite to test lend, sell and offers
    describe('Offer', function(){
        var password = 'test';

        var bob = {
            username: 'bob',
            password: password,
            avatar: 'http://vignette1.wikia.nocookie.net/southpark/images/3/3f/South_Park_Avatar_Wallpaper800x600.png/revision/latest?cb=20111107043648'
        };

        var mary = {
            username: 'mary',
            password: password,
            avatar: 'http://40.media.tumblr.com/2b5c21a3cf0b4c3cb18387a4528ea213/tumblr_n2sg0bi0Ub1qimttgo1_500.png'
        };

        var thing = {
            name: 'Test Thing',
            type: 'Test Type',
            desc: 'Test Desc',
            lend: {
                deposit: 100
            },
            sell: {
                price: 150
            },
            pictures : ['http://www6.pcmag.com/media/images/402617-surface-pro-4.jpg', 'http://tech.blorge.com/wp-content/uploads/2015/09/Surface-Pro-4.jpg']
        };

        var borrowOffer = {}; var buyOffer = {};

        // create the owner objects
        before(function(done) {
            new User(bob).save(function(err, saved1) {
                if (err) throw err;
                new User(mary).save(function(err, saved2) {
                    if (err) throw err;
                    saved1.password = password;
                    saved2.password = password;

                    // set the users properly
                    bob = saved1;
                    mary = saved2;

                    request(getUrl(developmentMode, bob.username, password)) // request from BOB
                	.post(routes.things) // to POST @ /api/things
                    .send(thing) // send in the thing
                	.end(function(err, res) {
                        if (err) throw err;
                        thing = res.body.data;

                        // mary wants to request bob to borrow the thing
                        borrowOffer = {
                            _from: mary._id,
                            _to: bob._id,
                            _borrow: thing._lend
                        };

                        // mary wants to request bob to buy the thing
                        buyOffer = {
                            _from: mary._id,
                            _to: bob._id,
                            _buy: thing._sell
                        };

                        done();
                    });
                });
            });
        });

        // TEST : Try to make a request to borrow from self
        it('should not make an offer to borrow to one\'s own item', function(done) {
            // from BOB to BOB request to borrow
            var invalidOffer = {
                _from: bob._id,
                _to: bob._id,
                _borrow: thing._lend
            };
            request(getUrl(developmentMode, bob.username, password)) // request from BOB
            .post(routes.offers(thing._id)) // to POST @ /api/things/id/offers
            .send(invalidOffer) // send in invalidOffer
            .end(function(err, res) {

                if(err) throw err;
                res.status.should.be.equal(400); // should return HTTP 400
                (typeof res.status.data).should.be.equal('undefined'); // no offer made

                done();
            });
        });

        // TEST : Try to a reqest to buy from self
        it('should not make an offer to buy to oneself', function(done) {
            // invalid offer from BOB to BOB
            var invalidOffer = {
                _from: bob._id,
                _to: bob._id,
                _buy: thing._sell
            };
            request(getUrl(developmentMode, bob.username, password)) // request from BOB
            .post(routes.offers(thing._id)) // to POST @ /api/things/id/offers
            .send(invalidOffer) // send in invalidOffer
            .end(function(err, res) {

                if(err) throw err;
                res.status.should.be.equal(400); // should return HTTP 400
                (typeof res.status.data).should.be.equal('undefined'); // no offer made

                done();
            });
        });

        // TEST : Try to request to buy from invalid user
        it('should not make an offer to an invalid user', function(done) {
            // offer from mary to invalid id
            var invalidOffer = {
                _from: mary._id,
                _to: '568822962eb4444603227e23',
                _buy: thing._sell
            };
            request(getUrl(developmentMode, mary.username, password)) // request from MARY
            .post(routes.offers(thing._id)) // to POST @ /api/things/id/offers
            .send(invalidOffer) // send in invalidOffer
            .end(function(err, res) {

                if(err) throw err;
                res.status.should.be.equal(400); // should return HTTP 400
                (typeof res.status.data).should.be.equal('undefined'); // no offer made

                done();
            });
        });

        // TEST : Try to borrow from an invalid user
        it('should not make an offer from an invalid user', function(done) {
            // offer from invalid id to bob
            var invalidOffer = {
                _from: '568822962eb4444603227e23',
                _to: bob._id,
                _borrow: thing._borrow
            };
            request(getUrl(developmentMode, bob.username, password)) // request from BOB
            .post(routes.offers(thing._id)) // to POST @ /api/things/id/offers
            .send(invalidOffer) // send in invalidOffer
            .end(function(err, res) {

                if(err) throw err;
                res.status.should.be.equal(400); // should return HTTP 400
                (typeof res.status.data).should.be.equal('undefined'); // no offer made

                done();
            });
        });

        // TEST : Try to borrow something you cannot borrow
        it('should not make an offer to borrow that you cannot borrow', function(done) {
            // offer from mary to bob
            var invalidOffer = {
                _from: mary._id,
                _to: bob._id,
                _borrow: thing._sell
            };
            request(getUrl(developmentMode, mary.username, password)) // request from MARY
            .post(routes.offers(thing._id)) // to POST @ /api/things/id/offers
            .send(invalidOffer) // send in invalidOffer
            .end(function(err, res) {

                if(err) throw err;
                res.status.should.be.equal(400); // should return HTTP 400
                (typeof res.status.data).should.be.equal('undefined'); // no offer made

                done();
            });
        });

        // TEST : Try to borrow something you cannot buy
        it('should not make an offer to buy that you cannot buy', function(done) {
            // offer from mary to bob
            var invalidOffer = {
                _from: mary._id,
                _to: bob._id,
                _buy: thing._lend
            };
            request(getUrl(developmentMode, mary.username, password)) // request from MARY
            .post(routes.offers(thing._id)) // to POST @ /api/things/id/offers
            .send(invalidOffer) // send in invalidOffer
            .end(function(err, res) {

                if(err) throw err;
                res.status.should.be.equal(400); // should return HTTP 400
                (typeof res.status.data).should.be.equal('undefined'); // no offer made

                done();
            });
        });

        // TEST : Try to make a request to borrow the thing
        it('should make an offer to borrow the thing', function(done) {
            request(getUrl(developmentMode, mary.username, password)) // request from MARY
            .post(routes.offers(thing._id)) // to POST @ /api/things/id/offers
            .send(borrowOffer) // send in borrowOffer
            .end(function(err, res) {
                if(err) throw err;
                borrowOffer = res.body.data;

                // check for usual fields
                borrowOffer.should.have.property('_id');
                borrowOffer.should.have.property('_from');
                borrowOffer.should.have.property('_to');
                borrowOffer.should.have.property('_borrow');
                // make sure that offers are set up properly
                borrowOffer.should.have.property('declined');
                borrowOffer.declined.should.be.false();
                // make sure that offers are set up properly
                borrowOffer.should.have.property('accepted');
                borrowOffer.declined.should.be.false();

                done();
            });
        });

        // TEST : Try to make a request to buy the thing
        it('should make an offer to buy the thing', function(done) {
            request(getUrl(developmentMode, mary.username, password)) // request from MARY
            .post(routes.offers(thing._id)) // to POST @ /api/things/id/offers
            .send(buyOffer) // send in buyOffer
            .end(function(err, res) {
                if(err) throw err;
                buyOffer = res.body.data;

                // check for usual fields
                buyOffer.should.have.property('_id');
                buyOffer.should.have.property('_from');
                buyOffer.should.have.property('_to');
                buyOffer.should.have.property('_buy');
                // make sure that offers are set up properly
                borrowOffer.should.have.property('declined');
                borrowOffer.declined.should.be.false();
                // make sure that offers are set up properly
                borrowOffer.should.have.property('accepted');
                borrowOffer.declined.should.be.false();

                done();
            });
        });

        // TEST : Try to accept an offer to borrow the thing
        it('should accept an offer to borrow the thing (reservation OK)', function(done) {
            request(getUrl(developmentMode, bob.username, password)) // request from bob
            .post(routes.accept(thing._id, borrowOffer._id)) // to POST @ /api/things/id/offers/id/accept
            .send({})
            .end(function(err, res) {
                if(err) throw err;
                var thing = res.body;

                // returns only the thing now which should be reserved to the offer
                thing.should.have.property('_reservedTo');
                thing._reservedTo.should.be.equal(borrowOffer._id);

                done();
            });
        });

        // TEST : Try to decline an offer to buy the thing
        it('should decline an offer to buy the thing (reservation NOT removed)', function(done) {
            request(getUrl(developmentMode, bob.username, password)) // request from bob
            .post(routes.decline(thing._id, buyOffer._id)) // to POST @ /api/things/id/offers/id/accept
            .send({})
            .end(function(err, res) {
                if(err) throw err;
                var thing = res.body;

                // should still have the reservation
                thing.should.have.property('_reservedTo');
                thing._reservedTo.should.be.equal(borrowOffer._id);

                done();
            });
        });

        // TEST : Try to decline an offer to borrow the thing
        it('should decline the previous offer to borrow the thing (reservation REMOVED)', function(done) {
            request(getUrl(developmentMode, bob.username, password)) // request from bob
            .post(routes.decline(thing._id, borrowOffer._id)) // to POST @ /api/things/id/offers/id/accept
            .send({})
            .end(function(err, res) {
                if(err) throw err;
                var thing = res.body;
                // should NOT have the reservation
                thing.should.not.have.property('_reservedTo');

                done();
            });
        });

        // TEST : Try to close a thing
        it('should close a product', function(done) {
            request(getUrl(developmentMode, bob.username, password)) // request from bob
            .post(routes.close(thing._id)) // to POST @ /api/things/id/close
            .send({})
            .end(function(err, res) {
                if(err) throw err;
                var thing = res.body;

                // ID
                thing.should.have.property('_id');
                thing._id.should.be.equal(thing._id);
                // CLOSED
                thing.should.have.property('closed');
                thing.closed.should.be.true();

                done();
            });
        });

        // TEST : Try to close a closed thing
        it('should not close a closed product', function(done) {
            request(getUrl(developmentMode, bob.username, password)) // request from bob
            .post(routes.close(thing._id)) // to POST @ /api/things/id/close
            .send({})
            .end(function(err, res) {
                if(err) throw err;

                res.status.should.be.equal(400); // should return HTTP 400
                (typeof res.body.data).should.be.equal('undefined'); // doesn't return data

                done();
            });
        });

        // TEST : Try to borrow a closed thing
        it('should not accept offer to borrow a closed product', function(done) {
            request(getUrl(developmentMode, bob.username, password)) // request from bob
            .post(routes.accept(thing._id, borrowOffer._id)) // to POST @ /api/things/id/offers/id/accept
            .send({})
            .end(function(err, res) {
                if(err) throw err;

                res.status.should.be.equal(400); // should return HTTP 400
                (typeof res.body.data).should.be.equal('undefined'); // doesn't return data

                done();
            });
        });

        // TEST : Try to buy a closed thing
        it('should not accept offer to buy a closed product', function(done) {
            request(getUrl(developmentMode, bob.username, password)) // request from bob
            .post(routes.accept(thing._id, buyOffer._id)) // to POST @ /api/things/id/offers/id/accept
            .send({})
            .end(function(err, res) {
                if(err) throw err;

                res.status.should.be.equal(400); // should return HTTP 400
                (typeof res.body.data).should.be.equal('undefined'); // doesn't return data

                done();
            });
        });

        // clear our the created users and things for next test
        after(function(done) {
            new User(bob).remove(function (err, deleted) {
                if (err) throw err;
                new User(mary).remove(function (err, deleted) {
                    if (err) throw err;
                    new Thing(thing).remove(function (err, deleted) {
                        if (err) throw err;
                        new Offer(borrowOffer).remove(function (err, deleted) {
                            if (err) throw err;
                            new Offer(buyOffer).remove(function (err, deleted) {
                                if (err) throw err;
                                done();
                            });
                        });
                    });
                });
            });
        });
    });
});
