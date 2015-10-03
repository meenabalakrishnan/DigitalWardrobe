angular.module('DigitalStylist')


.controller('PlacesController', function($scope, $ionicLoading, $compile, $rootScope, $state) {

    $scope.lastPlaceQuery = "";
    $scope.searchForPlace = function () {
        if (!$scope.placeQuery || 
            $scope.placeQuery.length < 4) {
            $scope.placeSearchResults = [];
            return;
        }
        
        // if ($scope.lastPlaceQuery) {
        //     var diff = $scope.placeQuery.length - $scope.lastPlaceQuery.length;
        //     var longer = $scope.placeQuery;
        //     var shorter = $scope.lastPlaceQuery;
            
        //     if (diff < 0) {
        //         shorter = $scope.placeQuery;
        //         longer  = $scope.lastPlaceQuery;
        //         diff  = -1*diff;
        //     }
            
        //     if (longer.substring(0, longer.length - diff) == shorter) {
        //         if (diff < 3) {
        //             return;
        //         }
        //     }
        // }
        
        // $scope.lastPlaceQuery = $scope.placeQuery;
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                $scope.searchNearBy(position.coords.latitude, position.coords.longitude);
            }, function onError(error) {
                $scope.addMessage(false, "Unable to access location");
            });
            
        } else {
            //default to Building 18
            $scope.initializeGoogleMap(47.644117,-122.129444);
        }
    };
    
    $scope.placeSearchResults = [];
    $scope.map = null;
    $scope.markers = [] ;
    $scope.searchNearBy = function (latitude, longitude) {
        var pyrmont = new google.maps.LatLng(latitude, longitude);
            
        if (!$scope.map) {
            $scope.map = new google.maps.Map(document.getElementById('map'), {
                center: pyrmont,
                zoom: 8
            });
        };
        
        for (var i = 0; i < $scope.markers.length; i++) {
            $scope.markers[i].setMap(null);
        }
        
        var request = {
            location: pyrmont,
            radius: '20000',
            query: $scope.placeQuery,
            rankby: google.maps.places.RankBy.DISTANCE
        };
        
        var service = new google.maps.places.PlacesService($scope.map);
        service.textSearch(request,  function callback(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                $scope.placeSearchResults = results.slice(0,10);
                 for (var i = 0; i < $scope.placeSearchResults.length; i++) {
                     var place = $scope.placeSearchResults[i];
                     var placeLoc = place.geometry.location;
                     var marker = new google.maps.Marker({
                         map: $scope.map,
                         position: place.geometry.location
                     });
                     $scope.markers.push(marker);
                     google.maps.event.addListener(marker, 'click', function() {
                         var infowindow = new google.maps.InfoWindow({content: $scope.placeToString(place)});
                         infowindow.open($scope.map, this);
                     });
                 }
                $scope.$digest();
            }
        });
    };

    $scope.setPartyAddress = function(place){
        $state.go('party');
        $rootScope.partyAddress = $scope.placeToString(place);
    };
    
    $scope.placeToString = function(place) {
        return place.name +", " + place.formatted_address;
    };
});    
