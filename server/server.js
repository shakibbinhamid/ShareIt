/*****************************************************************************\
 | Server : server.js                                                          |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | The starting place for the server.                                          |
 | All the rest routes and db integration is placed here.                      |
 \*****************************************************************************/


// Load required packages
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var passport = require('passport');
var thingController = require('./controllers/thing');
var lendController = require('./controllers/lend');
var sellController = require('./controllers/sell');
var offerController = require('./controllers/offer');
var userController = require('./controllers/user');
var authController = require('./controllers/auth');
var pushTokensController = require('./controllers/pushToken');

// Run on assigned port or 3000 if not assigned one by dino
var port = process.env.PORT || 3000;

// Connect to MongoDB db
mongoose.connect('mongodb://user:pass@ds041643.mongolab.com:41643/mean-database');

// Create our Express application
var app = express();

// Use the body-parser package in our application
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// Use the passport package in our application
app.use(passport.initialize());

// Create our Express router
var router = express.Router();

// GET POST @ /things
router.route('/things')
    .post(authController.isAuthenticated, thingController.postThings)
    .get(authController.isAuthenticated, thingController.getThings);

// GET PUT DELETE @ /things/:Thing_id
router.route('/things/:thing_id')
    .get(authController.isAuthenticated, thingController.getThing)
    .put(authController.isAuthenticated, thingController.putThing)
    .delete(authController.isAuthenticated, thingController.deleteThing);

// POST GET @ /things/:thing_id/lend
// Only used in testing
router.route('/things/:thing_id/lend')
    .post(authController.isAuthenticated, lendController.postLend)
    .get(authController.isAuthenticated, lendController.getLend);

// PUT DELETE @ /things/:thing_id/lend/lend_id
// Only used in testing
router.route('/things/:thing_id/lend/:lend_id')
    .put(authController.isAuthenticated, lendController.putLend)
    .delete(authController.isAuthenticated, lendController.deleteLend);

// POST GET @ /things/:thing_id/sell
// Only used in testing
router.route('/things/:thing_id/sell')
    .post(authController.isAuthenticated, sellController.postSell)
    .get(authController.isAuthenticated, sellController.getSell);

router.route('/things/:thing_id/close')
    .post(authController.isAuthenticated, thingController.closeProduct);

// PUT DELETE @ /things/:thing_id/sell/sell_id
// Only used in testing
router.route('/things/:thing_id/sell/:sell_id')
    .put(authController.isAuthenticated, sellController.putSell)
    .delete(authController.isAuthenticated, sellController.deleteSell);

// POST GET @ /things/:thing_id/offers
router.route('/things/:thing_id/offers/')
    .post(authController.isAuthenticated, offerController.postOffer)
    .get(authController.isAuthenticated, offerController.getAllOffers);

// GET @ /things/:thing_id/offers
router.route('/things/:thing_id/offers/:offer_id')
    .get(authController.isAuthenticated, offerController.getOffer);

router.route('/things/:thing_id/offers/:offer_id/accept')
    .post(authController.isAuthenticated, offerController.acceptOffer);

router.route('/things/:thing_id/offers/:offer_id/decline')
    .post(authController.isAuthenticated, offerController.declineOffer);

// POST GET /users
router.route('/users')
    .post(userController.postUsers)
    .get(authController.isAuthenticated, userController.getUsers);

// PUT /users/:username
router.route('/users/:username')
    .get(authController.isAuthenticated, userController.getUser)
    .put(authController.isAuthenticated, userController.putUser);

// GET /users/:username/offers
router.route('/users/offers/to')
    .get(authController.isAuthenticated, userController.getAllOffers);

// GET /users/:username/things
router.route('/users/:username/things')
    .get(authController.isAuthenticated, userController.getUserThings);

// PUT /users/:username/rating
router.route('/users/:username/rating')
    .put(authController.isAuthenticated, userController.putUserRating);

// PUT /pushTokens
router.route('/pushTokens')
    .put(authController.isAuthenticated, pushTokensController.putPushToken);

// Register all our routes with /api
app.use('/api', router);

// Start the server
app.listen(port);
