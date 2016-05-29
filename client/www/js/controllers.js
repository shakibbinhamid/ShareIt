angular.module('starter.controllers', [])

.controller('AppCtrl', function ($scope, $ionicHistory, $state, LoginFactory, ProductFactory) {

    $scope.logout = function () {
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache().then(function (obj) {
            console.log("CACHE CLEARED");
            $state.go('login');
        })
    };

    $scope.viewProfile = function () {
        $state.go('app.profile',{'username': LoginFactory.getUsername()})
    };

    $scope.viewCategories = function () {
        $state.go('app.categories')
    };

    $scope.viewRequests = function () {
        $state.go('app.requests');
    }

    $scope.getState = function(){
        return $ionicHistory.currentStateName();
    };

})

.controller('LoginCtrl', function ($scope,
                                   $state,
                                   $ionicPopup,
                                   LoginFactory) {

    // Form data for the login modal
    $scope.loginData = {};
    $scope.loginData = {
        username: 'shak',
        password: 'pass'
    };

    // Open the login modal
    $scope.login = function () {
        LoginFactory.authenticateUser($scope.loginData.username, $scope.loginData.password).then(
            function (res) {
                LoginFactory.setUser(res.data.data);
                //pushRegister();
                $state.go('app.products');
            },
            function (err) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Unauthorised!',
                    template: 'Invalid username/password'
                });
                alertPopup.then(function (res) {
                    console.log(err);
                });
            });
    };

    var pushRegister = function () {
        var io = Ionic.io();
        var push = new Ionic.Push({
            "onNotification": function (notification) {
                alert('Received push notification!');
            },
            "pluginConfig": {
                "android": {
                    "iconColor": "#0000FF"
                }
            }
        });
        var user = Ionic.User.current();

        if (!user.id) {
            user.id = Ionic.User.anonymousId();
        }

        // Just add some dummy data..
        user.set('name', LoginFactory.getUsername());
        user.set('bio', 'This is my little bio');
        user.save();

        var callback = function (data) {
            push.addTokenToUser(user);
            user.save();
            LoginFactory.registerForPush(data._token).then(function(res){},function(err){});
        };

        push.register(callback);
    };
})

.controller('ProductListCtrl', function ($scope,
                                         $ionicPopup,
                                         $ionicModal,
                                         $ionicLoading, $ionicPopup,
                                         $cordovaCamera,
                                         $cordovaImagePicker,
                                         $cordovaDatePicker,
                                         $state,
                                         products,
                                         ProductFactory,
                                         LoginFactory,
                                         AlertFactory)
{
    ProductFactory.addProductsLocal(products.data.data);
    $scope.products = ProductFactory.getProducts();

    var newProduct = {
        name: '',
        type: '',
        desc: '',
        lend: {
            deposit: 0,
            from: new Date()
        },
        sell: {
            price: 0
        },
        pictures: []
    };
    $scope.newProduct = newProduct;
    $scope.lend = true;
    $scope.sell = false;

    $scope.viewDate = function (dateString) {
        return new Date(dateString).toDateString();
    };

    $scope.viewProfile = function () {
        $state.go('app.profile',{'username': LoginFactory.getUsername()})
    };

    /*********************************** MODALS & ALERTS **************************************************/

    //Alert pop up generator
    $scope.showAlert = AlertFactory.showAlert;

    var datepickerOptions = {
        date: new Date(),
        mode: 'date',
        allowFutureDates: true,
        doneButtonLabel: 'DONE',
        doneButtonColor: '#F2F3F4',
        cancelButtonLabel: 'CANCEL',
        cancelButtonColor: '#000000',
        allowOldDates: false
    };

    //New Product modal creation
    $ionicModal.fromTemplateUrl('templates/new-product.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.newProductModal = modal;
    });

    $scope.showDatepicker = function() {
        datepickerOptions.date = $scope.newProduct.lend.from;
        $cordovaDatePicker.show(datepickerOptions).then(function(date){
            $scope.newProduct.lend.from = date;
        });
    };

    //Views the new product modal
    $scope.openNewProductModal = function () {
        $scope.newProductModal.show();
    };

    //Closes the new product modal and clear fields in modal
    $scope.closeNewProductModal = function () {
        $scope.newProductModal.hide();
        $scope.newProduct = newProduct;
        $scope.lend = true;
        $scope.sell = false;
        $scope.allImages.length = 0;
        $scope.allImages = $scope.newProduct.pictures;
    };

    /*********************************** ADD PRODUCT **************************************************/

    /**
     *Method to add a Product. If fails to save, shows error.
     */
    $scope.addProduct = function () {
        $scope.setCategory();
        ProductFactory.addProductServer($scope.newProduct).then(function (res) { //Request to add product
            ProductFactory.addProductLocal(res.data.data); //Successfully Added
            $scope.closeNewProductModal(); //Close modal
            $scope.showAlert('Successful!', 'Your Product was added!');
        }, function (err) {
            console.log(err);
            $scope.showAlert('FAILED !', err.data.message);
        })
    };

    $scope.categories = [
        {id: 1, text: 'Others', checked: false, icon: 'img/recycle.png'},
        {id: 2, text: 'Book', checked: false, icon: 'img/book.svg'},
        {id: 3, text: 'Laptop', checked: false, icon: 'img/laptop.svg'},
        {id: 4, text: 'Stationery', checked: false, icon: 'img/stationery.png'},
        {id: 5, text: 'Phone', checked: false, icon: 'img/smartphone.svg'},
        {id: 6, text: 'Kitchen Stuff', checked: false, icon: 'img/cutlery.png'},
    ];

    $scope.cateSelec = 'Choose categories';
    $scope.val = {categories:''};

    $scope.resetCategories = function() {
        $scope.cateSelec = 'Choose categories';
        for(var i = 0; i < $scope.categories.length; i++){
            $scope.categories[i].checked = false;
        }
    }

    $scope.setCategory = function() {
        $scope.newProduct.type = $scope.val.categories;
    }

    /********************************** ADD IMAGES *************************************************/

    $scope.allImages = $scope.newProduct.pictures;

    $scope.showImages = function (index) {
        $scope.activeSlide = index;
        $scope.showImageModal('templates/image-popover.html');
    };

    $scope.showImageModal = function (templateUrl) {
        $ionicModal.fromTemplateUrl(templateUrl, {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.imageModal = modal;
            $scope.imageModal.show();
        });
    };

    $scope.closeImageModal = function () {
        $scope.imageModal.hide();
        $scope.imageModal.remove()
    };

    $scope.takePicture = function () {
        var options = {
            quality: 50,
            targetWidth: 100,
            targetWidth: 200,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG,
            saveToPhotoAlbum: false,
            correctOrientation: true
        };

        $cordovaCamera.getPicture(options).then(function (imageData) {
            $scope.allImages.push("data:image/jpeg;base64," + imageData);
            $ionicLoading.show({
                template: 'Photo loading...',
                duration: 500
            });
        }, function (err) {
            $ionicLoading.show({
                template: 'Error...',
                duration: 500
            });
        })
    };

    $scope.selectPicture = function () {
        var options = {
            maximumImagesCount: 2, // Max number of selected images
            width: 100,
            height: 200,
            quality: 50
        };

        $cordovaImagePicker.getPictures(options).then(function (results) {
            for(var i = 0; i<results.length; i++){
                window.plugins.Base64.encodeFile(results[i], function (base64) { // Encode URI to Base64
                    $scope.allImages.push(base64);
                    setTimeout(function () {
                        $scope.$apply();
                    }, 200);
                });
            }
        }, function (error) {
            console.log('Error: ' + JSON.stringify(error)); // In case of error
        });
    };

    /***********************************    OFFERS    **********************************/

    // Triggered on a button click, or some other target
    $scope.borrow = function (product) {
        if (product._owner._id === LoginFactory.getUser()._id)
            $scope.showAlert('Can\'t Borrow Own Things !');
        else {
            $scope.borrowObj = {
                _from : LoginFactory.getUser()._id,
                _to : product._owner._id,
                _borrow : product._lend._id
            };

            // An elaborate, custom popup
            var reasonPopup = $ionicPopup.show({
                template: '<textarea msd-elastic="\n" type="text" ng-model="borrowObj.reason"><textarea>',
                title: 'Reason',
                subTitle: 'Please state why you want to borrow',
                scope: $scope,
                buttons: [ {
                        text: 'BACK',
                        type: 'button-small button-assertive',
                        onTap: function (e) {
                            return 'CANCEL'
                        }
                    }, {
                        text: 'OK',
                        type: 'button-small button-balanced',
                        onTap: function (e) {
                            return $scope.borrowObj
                        }
                    }
                ]
            });

            reasonPopup.then(function (borrow) {
                if (borrow === 'CANCEL') return;
                ProductFactory.makeOffer(product._id, borrow).then(function(res) {
                    $scope.showAlert(res.data.message);
                }, function(err) {
                    console.log(err);
                    $scope.showAlert('ERROR: Couldn\'t Make the Request !');
                });
            }, function (err) {
                console.log(err)
            });
        };
    };

    $scope.buy = function(product) {
        if (product._owner._id === LoginFactory.getUser()._id)
            $scope.showAlert('Can\'t Buy Own Things !');
        else {
            var buy = {
                _from : LoginFactory.getUser()._id,
                _to : product._owner._id,
                _buy : product._sell._id
            };
            ProductFactory.makeOffer(product._id, buy).then(function(res) {
                $scope.showAlert(res.data.message);
            }, function(err) {
                console.log(err);
                $scope.showAlert('ERROR: Couldn\'t Make the Request !');
            });
        };
    };

    /*************************************************************************************/

    /*************************************************************************************/

    /**
     *Method to load N more products from server
     */
    $scope.loadNextNMoreProducts = function (n) {
        ProductFactory.getNextNProductsFromServer(n, $scope.products[$scope.products.length - 1]._id).success(function (res) {
            ProductFactory.addProductsLocal(res.data);
            $scope.$broadcast('scroll.infiniteScrollComplete');
        })
    };

    /**
     *Method to check if new products are available
     */
    $scope.isNewProductAvailable = function (n) {
        ProductFactory.getNextNProductsFromServer(n, $scope.products[$scope.products.length - 1]._id).success(function (res) {
            return res.data.length > 0;
        })
    };

    $scope.doRefresh = function() {
        ProductFactory.getNProductsFromServer(20).success(function(res) {
            $scope.products = res.data;
        }).finally(function() {
            $scope.$broadcast('scroll.refreshComplete');
        });
    };

    /*****************************************   SEARCH   **************************************************************/

    $scope.search = {
        noResultsFound : false
    }; //The search query object
    $scope.searchResults = ProductFactory.getSearchResults(); //Search Results

    /**
     *Makes a search request when called if the search box is not empty
     */
    $scope.makeSearch = function () {
        if ($scope.search.name) { //if the search box isn't empty
            ProductFactory.search($scope.search).success(function (res) {
                if (res.data.length === 0) { //No results found, show alert
                    $scope.search.noResultsFound = true;
                }
                ProductFactory.setSearchResults(res.data); //Add search results
            })
        }
    }

    /**
     *Watches the search box. If it is cleared out (manually or by clicking x ), then search results are cleared out
     */
    $scope.$watch(
        function () { //Keep watch on search box
            return $scope.search.name;
        },
        function (newSearch, oldSearch) {
            if (!newSearch) { //search box empty
                ProductFactory.clearSearchResults(); //clear out search results
                if (newSearch) $scope.search.noResultsFound = false;
            }
        }
    );
})

.controller('ProductCtrl', function ($scope,
                                     $stateParams,
                                     $ionicModal,
                                     $state,
                                     product,
                                     offers,
                                     ProductFactory,
                                     LoginFactory)
{
    $scope.LoginFactory = LoginFactory;

    $scope.product = product.data.data;
    $scope.allImages = $scope.product.pictures;

    $scope.state = $state;

    if(LoginFactory.getUser()._id === $scope.product._owner._id)
        $scope.offers = offers.data.data;

    $scope.showImages = function (index) {
        $scope.activeSlide = index;
        $scope.showImageModal('templates/image-popover.html');
    };

    $scope.showImageModal = function (templateUrl) {
        $ionicModal.fromTemplateUrl(templateUrl, {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.imageModal = modal;
            $scope.imageModal.show();
        });
    };

    $scope.closeImageModal = function () {
        $scope.imageModal.hide();
        $scope.imageModal.remove()
    };

    $scope.viewProfile = function (username) {
        $state.go('app.profile',{'username': username})
    };

    $scope.viewDate = function (date) {
        return new Date(date).toDateString();
    };

    $scope.acceptOffer = function (offer) {
        offer.accepted = true;
        if (offer.declined) offer.declined = false;
        ProductFactory.acceptOffer($scope.product._id, offer._id).then(function(thing) {
            $scope.product._reservedTo = thing.data._reservedTo;
        }, function(err) {
            console.log(err);
        });
    };

    $scope.declineOffer = function (offer) {
        offer.declined = true;
        if (offer.accepted) offer.accepted = false;
        ProductFactory.declineOffer($scope.product._id, offer._id).then(function(thing) {
            $scope.product._reservedTo = thing.data._reservedTo;
        }, function(err) {
            console.log(err);
        });
    };

    $scope.completeOffer = function (offer) {
        ProductFactory.closeProduct($scope.product._id).then(function(obj){
            $scope.product.closed = obj.data.closed;
        }, function(err){
            console.log(err);
        });
    };
})

.controller('CategoryCtrl', function($scope,
                                     ProductFactory) {
    $scope.products = [];
    $scope.selected = {category: ''};
    $scope.getProductsForCategory = function (cat) {
        $scope.selected.category = cat;
        ProductFactory.search({category: cat}).success(function (res) {
            $scope.products = res.data;
        });
    };
})

.controller('ProfileCtrl', function($scope,
                                    $ionicListDelegate,
                                    $ionicPopup,
                                    AlertFactory,
                                    ProfileFactory,
                                    ProductFactory,
                                    LoginFactory,
                                    user,
                                    things){

    ProfileFactory.setViewedUser(user.data.data);
    $scope.loggedUsername = LoginFactory.getUsername();
    $scope.user = ProfileFactory.getViewedUser();

    $scope.products = things.data.data;
    /**
     *Method to delete a Product. If fails to save, shows error.
     */
    $scope.deleteProduct = function (id) {
        $scope.products.forEach(function(product) {
            if (product._id === id) {
                ProductFactory.removeProductServer(product._id).then(function (res) { //Try to remove from the server
                    console.log("DELETED : PRODUCT : " + res.data.data);
                    var index = $scope.products.indexOf(product);
                    $scope.products.splice(index, 1);
                }, function (err) {
                    console.log("FAILED : PRODUCT DELETATION");
                    $scope.showAlert('FAILED !', err.data.message);
                });
            };
        });
        $ionicListDelegate.closeOptionButtons(); //always close the sliding options
    };

    // Triggered on a button click, or some other target
    $scope.rateUsr = function () {
        if ($scope.user._id === LoginFactory.getUser()._id)
            AlertFactory.showAlert('Can\'t Rate Yourself !');
        else {
            $scope.rate = {
                rating : {}
            };

            // An elaborate, custom popup
            var ratePopup = $ionicPopup.show({
                template:
                    '<div style="text-align:center">' +
                        '<rating ng-model="rate.rating.rating" max="5"></rating>' +
                    '</div>' +
                    '<textarea msd-elastic="\n" type="text" ng-model="rate.rating.comment"><textarea>',
                title: 'Rate',
                subTitle: 'Please click on the star (no 0 rating)',
                scope: $scope,
                buttons: [ {
                        text: 'BACK',
                        type: 'button-small button-assertive',
                        onTap: function (e) {
                            return 'CANCEL';
                        }
                    }, {
                        text: 'OK',
                        type: 'button-small button-balanced',
                        onTap: function (e) {
                            return $scope.rate;
                        }
                    }
                ]
            });

            ratePopup.then(function (rate) {
                if (rate === 'CANCEL') return;
                ProfileFactory.rateUser($scope.user.username, $scope.rate).then(function(res) {
                    $scope.user.rating.average = res.data.rating.average;
                    $scope.user.rating.count = res.data.rating.count;
                    $scope.user.rating.comments = res.data.rating.comments;
                }, function(err) {
                    console.log(err);
                    AlertFactory.showAlert('ERROR: No 0 Rating Allowed !');
                });
            }, function (err) {
                console.log(err);
            });
        };
    };
})

.controller('NotificationCtrl', function($scope,
                                         $state,
                                         ProductFactory,
                                         offers)
{
    $scope.state = $state;
    $scope.recentOffers = [];
    $scope.restOffers = [];

    var offers = offers.data.data;

    var inLast7Days = function (offer) {
        return  new Date(new Date().getDate() - 7) - new Date(offer.updatedAt).getDate() <= 0;
    };

    for (var i=0; i<offers.length; i++) {
        if (inLast7Days(offers[i])) $scope.recentOffers.push(offers[i]);
        else $scope.restOffers.push(offers[i]);
    }

    $scope.viewDate = function (date) {
        return new Date(date).toDateString();
    };

    $scope.acceptOffer = function (offer) {
        var req = offer._borrow || offer._buy;
        ProductFactory.acceptOffer(req._thing._id, offer._id).then(function(thing) {
            offer.accepted = true;
            if (offer.declined) offer.declined = false;
            offers = offers.map(function(offer){
                var r = offer._borrow || offer._buy;
                if (r._thing._id === req._thing._id)
                    r._thing._reservedTo = thing.data._reservedTo;
                return offer;
            })
            console.log(offers)
        }, function(err) {
            console.log(err);
        });
    };

    $scope.declineOffer = function (offer) {
        var req = offer._borrow || offer._buy;
        ProductFactory.declineOffer(req._thing._id, offer._id).then(function(thing) {
            offer.declined = true;
            if (offer.accepted) offer.accepted = false;
            offers = offers.map(function(offer){
                var r = offer._borrow || offer._buy;
                if (r._thing._id === req._thing._id)
                    r._thing._reservedTo = thing.data._reservedTo;
                return offer;
            })
            console.log(offers)
        }, function(err) {
            console.log(err);
        });
    };

    $scope.completeOffer = function (offer) {
        var req = offer._borrow || offer._buy;
        ProductFactory.closeProduct(req._thing._id).then(function(obj){
            offers = offers.map(function(offer){
                var r = offer._borrow || offer._buy;
                if (r._thing._id === req._thing._id)
                    r._thing.closed = obj.data.closed;
                return offer;
            })
        }, function(err){
            console.log(err);
        });
    };


});
