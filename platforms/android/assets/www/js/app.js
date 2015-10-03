// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('DigitalStylist.services', ['ngResource']);
angular.module('DigitalStylist.controllers', []);
angular.module('DigitalStylist', ['ionic', 'DigitalStylist.controllers', 'DigitalStylist.services'])

.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
})

.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('home', { url: '/', templateUrl: "home.html", controller: 'HomeController' })
    .state('addclothing', { url: '/outfits', templateUrl: "addclothing.html", controller: 'HomeController' })
    .state('outfits', { url: '/outfits', templateUrl: "outfits.html", controller: 'HomeController' })
    .state('wishlists', { url: '/wishlists', templateUrl: "wishlists.html", controller: 'HomeController' })
    .state('closet', { url: '/closet', templateUrl: "closet.html", controller: 'HomeController' })
    .state('gym', { url: '/gym', templateUrl: "gym.html", controller: 'GymController' })
    .state('party', { url: '/party/:activityName', templateUrl: "party.html" })
    .state('restaurant', { url: '/restaurant/:term', templateUrl: "restaurant.html", controller: 'RestaurantCtrl' })
    .state('workout', { url: '/workout', templateUrl: "workout.html", controller: 'WorkoutController' })
    .state('workoutstatistics', { url: '/workoutstatistics', templateUrl: "workoutstatistics.html", controller: 'StatisticsController' })
    .state('places', { url: '/places', templateUrl: "places.html" });

    $urlRouterProvider.otherwise("/");
});

