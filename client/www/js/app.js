// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic',
                           'starter.services',
                           'starter.controllers',
                           'ionic-material',
                           'ionMdInput',
                           'monospaced.elastic',
                           'ngCordova',
                           'ionic.rating'])

.run(function ($ionicPlatform, $rootScope, $ionicLoading) {

    /********************* LOADING SCREEN ********************************************************/
    $rootScope.$on('loading:show', function () {
        $ionicLoading.show({
            template:'<ion-spinner icon="ripple" class="spinner-assertive"></ion-spinner>'
        })
    });

    $rootScope.$on('loading:hide', function () {
        $ionicLoading.hide();
    });

    $rootScope.$on('$stateChangeStart', function () {
        $rootScope.$broadcast('loading:show');
    });

    $rootScope.$on('$stateChangeSuccess', function () {
        $rootScope.$broadcast('loading:hide');
    });
    /*********************************************************************************************/

    $ionicPlatform.ready(function () {
        if (window.cordova && window.cordova.plugins.Keyboard) {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

            // Don't remove this line unless you know what you are doing. It stops the viewport
            // from snapping when text inputs are focused. Ionic handles this internally for
            // a much nicer keyboard experience.
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
})

.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider

    /*
    *Login State, Application starts here.
    */
    .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl',
        resolve: {
            clear: function (LoginFactory, ProductFactory) {
                LoginFactory.clearAll();
                ProductFactory.clearAll();
                console.log("PREVIOUS DATA CLEARED");
            }
        }
    })

    /*
    *Total Application State, Views starts here.
    */
    .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
    })

    /*
    *Product List State
    */
    .state('app.products', {
        url: '/products',
        templateUrl: 'templates/homepage.html',
        controller: 'ProductListCtrl',
        resolve: {
            products: function ($ionicHistory, ProductFactory) {
                ProductFactory.clearAll();
                return ProductFactory.getNProductsFromServer(20);
            }
        },
        cache: false
    })

    .state('app.categories', {
        url: '/categories',
        templateUrl: 'templates/categories.html',
        controller: 'CategoryCtrl',
        cache: false
    })

    /*
    *Profile State
    */
    .state('app.profile', {
        url: '/profile/:username',
        templateUrl: 'templates/profile.html',
        controller: 'ProfileCtrl',
        resolve: {
            user: function($stateParams, ProfileFactory){
                return ProfileFactory.getUserServer($stateParams.username);
            },
            things: function($stateParams, ProfileFactory){
                return ProfileFactory.getUserProductsRemote($stateParams.username);
            }
        }
    })

    .state('app.requests', {
        url: '/requests',
        templateUrl: 'templates/offers.html',
        controller: 'NotificationCtrl',
        resolve: {
            offers: function(LoginFactory){
                return LoginFactory.getOffersTo();
            }
        },
        cache: false
    })

    /*
    *Single Product View State
    */
    .state('app.product', {
        url: '/products/:productId',
        templateUrl: 'templates/product.html',
        controller: 'ProductCtrl',
        resolve: {
            product: function($stateParams, ProductFactory){
                return ProductFactory.getProductServer($stateParams.productId);
            },
            offers: function($stateParams, ProductFactory){
                return ProductFactory.getOffersServer($stateParams.productId);
            }
        }
    });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');
})

.directive('fancySelect',
    [
        '$ionicModal',
        function($ionicModal) {
            return {
                /* Only use as <fancy-select> tag */
                restrict : 'E',

                /* Our template */
                templateUrl: 'templates/fancy-select.html',

                /* Attributes to set */
                scope: {
                    'items'        : '=', /* Items list is mandatory */
                    'text'         : '=', /* Displayed text is mandatory */
                    'value'        : '=', /* Selected value binding is mandatory */
                    'callback'     : '&'
                },

                link: function (scope, element, attrs) {

                    /* Default values */
                    scope.multiSelect   = attrs.multiSelect === 'true' ? true : false;
                    scope.allowEmpty    = attrs.allowEmpty === 'false' ? false : true;

                    /* Header used in ion-header-bar */
                    scope.headerText    = attrs.headerText || '';

                    /* Text displayed on label */
                    // scope.text          = attrs.text || '';
                    scope.defaultText   = scope.text || '';

                    /* Notes in the right side of the label */
                    scope.noteText      = attrs.noteText || '';
                    scope.noteImg       = attrs.noteImg || '';
                    scope.noteImgClass  = attrs.noteImgClass || '';

                    scope.callback = attrs.callback || null;

                    $ionicModal.fromTemplateUrl(
                        'templates/fancy-select-items.html',
                          {'scope': scope}
                    ).then(function(modal) {
                        scope.modal = modal;
                    });

                    /* Validate selection from header bar */
                    scope.validate = function (event) {
                        // Construct selected values and selected text
                        if (scope.multiSelect == true) {

                            // Clear values
                            scope.value = '';
                            scope.text = '';

                            // Loop on items
                            for (var i = 0; i < scope.items.length; i++) {
                                var item = scope.items[i];
                                if (item.checked) {
                                    scope.value = scope.value + item.text+', ';
                                    scope.text = scope.text + item.text+', ';
                                }
                            }

                            // Remove trailing comma
                            scope.value = scope.value.substr(0,scope.value.length - 1);
                            scope.text = scope.text.substr(0,scope.text.length - 2);
                        }

                        // Select first value if not nullable
                        if (typeof scope.value == 'undefined' || scope.value == '' || scope.value == null ) {
                            if (scope.allowEmpty == false) {
                                scope.value = scope.items[0].id;
                                scope.text = scope.items[0].text;

                                // Check for multi select
                                scope.items[0].checked = true;
                            } else {
                                scope.text = scope.defaultText;
                            }
                        }

                        // Hide modal
                        scope.hideItems();

                        // Execute callback function
                        if (typeof scope.callback == 'function') {
                            scope.callback (scope.value);
                        }
                    }

                    /* Show list */
                    scope.showItems = function (event) {
                        event.preventDefault();
                        scope.modal.show();
                    }

                    /* Hide list */
                    scope.hideItems = function () {
                        scope.modal.hide();
                    }

                    /* Destroy modal */
                    scope.$on('$destroy', function() {
                      scope.modal.remove();
                    });

                    /* Validate single with data */
                    scope.validateSingle = function (item) {

                        // Set selected text
                        scope.text = item.text;

                        // Set selected value
                        scope.value = item.id;

                        // Hide items
                        scope.hideItems();

                        // Execute callback function
                        if (typeof scope.callback == 'function') {
                            scope.callback (scope.value);
                        }
                    }
                }
            };
        }
    ]
)
