angular.module('starter.services', [])

/**
*Place to store all the routes
*/
.factory('RouteFactory', function(){

    var developement = true;

    var routes = {
        PROTOCOL : 'https://',
        APP : 'project-api.herokuapp.com/',
        API : 'api/',
        THINGS : 'things/',
        USERS : 'users/',
        OFFERS : 'offers/',
        PUSH_TOKENS : 'pushTokens/',
        ACCEPT : 'accept/',
        DECLINE : 'decline/',
        RATE : 'rating/',
        CLOSE : 'close/',
        TO : 'to/'
    };

    if (developement) {
        routes.PROTOCOL = 'http://';
        routes.APP = 'localhost:8100/';
    }

    // protocol://host/api/
    var API_LINK = routes.PROTOCOL + routes.APP + routes.API;

    // protocol://host/api/things
    routes.GET_THINGS = API_LINK + routes.THINGS;
    // protocol://host/api/
    routes.GET_USERS = API_LINK + routes.USERS;

    routes.GET_PUSH_TOKENS = API_LINK + routes.PUSH_TOKENS;

    // protocol://username:password@host/api/users/:username
    routes.GET_AUTH = function(username, password){
        return routes.PROTOCOL + username + ':' + password + '@' + routes.APP + routes.API + routes.USERS + username;
    };

    routes.GET_THING = function(thing_id) {
        return routes.GET_THINGS + thing_id;
    };

    routes.GET_USER = function(username) {
        return routes.GET_USERS + username;
    };

    routes.GET_USER_THINGS = function(username) {
        return routes.GET_USER(username) + '/' + routes.THINGS;
    };

    routes.GET_OFFERS = function(thing_id) {
        return routes.GET_THING(thing_id) + '/' + routes.OFFERS;
    };

    routes.ACCEPT_OFFER = function(thing_id, offerId) {
        return routes.GET_OFFERS(thing_id) + offerId + '/' + routes.ACCEPT;
    };

    routes.DECLINE_OFFER = function(thing_id, offerId) {
        return routes.GET_OFFERS(thing_id) + offerId + '/' + routes.DECLINE;
    };

    routes.USER_RATING = function(username) {
        return routes.GET_USER(username) + '/' + routes.RATE;
    };

    routes.CLOSE_THING = function(thing_id) {
        return routes.GET_THING(thing_id) + '/' + routes.CLOSE;
    };

    routes.USER_OFFERS_TO = function() {
        return routes.GET_USERS + routes.OFFERS + routes.TO;
    };

    return routes;
})

.factory('ProfileFactory', function($http, RouteFactory) {
    var viewedUser = {};
    var o = {};

    o.setViewedUser = function(user){
        viewedUser._id = user._id;
        viewedUser.username = user.username;
        viewedUser.avatar = user.avatar;
        viewedUser.rating = user.rating;
    };

    o.getViewedUser = function(){
        return viewedUser;
    };

    o.getUserServer = function(username){
        return $http.get(RouteFactory.GET_USER(username));
    };

    o.getUserProductsRemote = function(username){
        return $http.get(RouteFactory.GET_USER_THINGS(username));
    };

    o.rateUser = function(username, rating){
        return $http.put(RouteFactory.USER_RATING(username), rating);
    };

    return o;
})

/**
*LoginFactory is the intermediary data store for all things User
*/
.factory('LoginFactory', function($http, RouteFactory){

    var user = {
        _id: '',
        username: ''
    };

    /**
    *Clears all the data in LoginFactory
    */
    user.clearAll = function(){
        user.username = '';
    };

    /**
    *Sends a http request to authenticate the user.
    *Returns a promise
    */
    user.authenticateUser = function(username, password){
        var addr = RouteFactory.GET_AUTH(username, password);
        console.log("HTTP req : Auth : " + addr);
        return $http.get(addr);
    };

    /**
    *Sets local copy of username of the user that is logged in currentlu
    */
    user.setUser = function(usr){
        console.log("SET username = " + usr);
        user.username = usr.username;
        user._id = usr._id;
    };

    user.getUser = function(){
        return user;
    };

    user.getUsername = function(){
        return user.username;
    };

    user.registerForPush = function(tok) {
        var pushtoken = { token: tok };
        return $http.put(RouteFactory.GET_PUSH_TOKENS, pushtoken);
    };

    user.getOffersTo = function() {
        console.log(RouteFactory.USER_OFFERS_TO());
        return $http.get(RouteFactory.USER_OFFERS_TO());
    };

    return user;
})

/**
*ProductFactory is the intermediary data store for all things product
*/
.factory('ProductFactory', function ($http, RouteFactory) {

    var o = {
        products: [],
        searchResults: []
    };

    /*********************************  SEARCH  ***************************************************/

    /**
    *Clears all the data in ProductFactory
    */
    o.clearAll = function(){
        o.products.length = 0;
        o.searchResults.length = 0;
    };

    /**
    *Input: http params for search query. Makes a search request Returns a promise.
    */
    o.search = function(search_param) {
        console.log("SEARCHING");
        console.log(search_param);
        return o.getProductsFromServer({
            params : search_param
        });
    };

    /**
    *Sets local search results. Clears out the previous ones, even if the new ones = []
    */
    o.setSearchResults = function(results){
        o.clearSearchResults();
        console.log("SEARCH RESULTS");
        if (results) {
            console.log(results);
            for (var i = 0; i < results.length; i++)
                o.searchResults.push(results[i]);
        }
        return true;
    };

    /**
    *Returns the local search results
    */
    o.getSearchResults = function() {
        return o.searchResults;
    };

    /**
    *Returns the local search result at the index
    */
    o.getSearchResult = function(product_id) {
        for (var i=0; i<o.searchResults.length; i++)
            if (o.searchResults[i]._id === product_id)
                return o.searchResults[i];
    };

    /**
    *Clears the local search results
    */
    o.clearSearchResults = function() {
        console.log("SEARCH CLEARED");
        o.searchResults.length = 0;
    };

    /*********************************  PRODUCT  ***************************************************/


    /**
    *Returns a promise to get all the products
    */
    o.getProductsFromServer = function(config){
        return $http.get(RouteFactory.GET_THINGS, config);
    };

    /**
    *Returns n products from server
    */
    o.getNProductsFromServer = function(n){
        return o.getProductsFromServer({
            params : { limit : n }
        });
    };

    /**
    *Returns n products from server
    */
    o.getNextNProductsFromServer = function(n, lastId){
        return o.getProductsFromServer({
            params : { limit : n , _id : lastId}
        });
    };

    /**
    *Returns local list of products
    */
    o.getProducts = function () {
        return o.products;
    };

    /**
    *Return product from local list
    */
    o.getProductLocal = function (product_id) {
        for (var i=0; i<o.products.length; i++)
            if (o.products[i]._id === product_id)
                return o.products[i];
    };

    /**
    *Return product from server
    */
    o.getProductServer = function (product_id) {
        return $http.get(RouteFactory.GET_THING(product_id));
    };

    /**
    *Adds a list products to local list
    */
    o.addProductsLocal = function (newProducts) {
        o.products = o.products.concat(newProducts);
        return o.products;
    };

    /**
    *Adds a single product to local product list
    */
    o.addProductLocal = function (newProduct) {
        return o.products.push(newProduct);
    };

    /**
    *Adds a product to the server
    *Returns a promise
    */
    o.addProductServer = function (newProduct) {
        console.log("HTTP req : GET : " + RouteFactory.GET_THINGS);
        return $http.post(RouteFactory.GET_THINGS, newProduct); //Post request to server
    };

    /**
    *Removes a product locally
    */
    o.removeProductLocal = function (product) {
        var index = o.products.indexOf(product);
        if (index > -1) {
            o.products.splice(index, 1);
        }
    };

    /**
    *Removes a product from the server
    *Returns a promise
    */
    o.removeProductServer = function (productId) {
        var product_addr = RouteFactory.GET_THING(productId);
        console.log("HTTP req : DELETE : " + product_addr);
        return $http.delete(product_addr); //Delete request to server
    };

    /**
    *Makes an offer on a product
    *Returns a promise
    */
    o.makeOffer = function (productId, offer) {
        console.log("HTTP req : POST : " + RouteFactory.GET_OFFERS(productId) + offer);
        return $http.post(RouteFactory.GET_OFFERS(productId), offer);
    };

    /**
    *Gets the offers on a product
    *Returns a promise
    */
    o.getOffersServer = function (productId) {
        console.log("HTTP req : GET : " + RouteFactory.GET_OFFERS(productId));
        return $http.get(RouteFactory.GET_OFFERS(productId));
    };

    o.acceptOffer = function (productId, offerId) {
        console.log("HTTP req : POST : " + RouteFactory.ACCEPT_OFFER(productId, offerId));
        return $http.post(RouteFactory.ACCEPT_OFFER(productId, offerId));
    };

    o.declineOffer = function (productId, offerId) {
        console.log("HTTP req : POST : " + RouteFactory.DECLINE_OFFER(productId, offerId));
        return $http.post(RouteFactory.DECLINE_OFFER(productId, offerId));
    };

    o.closeProduct = function (productId) {
        console.log("HTTP req : POST : " + RouteFactory.CLOSE_THING(productId));
        return $http.post(RouteFactory.CLOSE_THING(productId));
    };

    return o;
})

.factory('AlertFactory', function ($ionicPopup) {
    var o = {};

    o.showAlert = function (tit, temp) {
        var alertPopup = $ionicPopup.alert({
            title: tit,
            template: temp
        });
        alertPopup.then(function (res) {
            console.log('POP UP : Title = ' + tit + " TEMPLATE " + temp);
        });
    };

    return o;
});
