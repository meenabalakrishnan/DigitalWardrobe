angular.module('DigitalStylist')

.controller('partyListCtrl', function($scope, $ionicModal, $stateParams) {

    $ionicModal.fromTemplateUrl('templates/contacts.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.contactsModal = modal;
    });
    $scope.newMessage = $stateParams.activityName;
    $scope.friendsList =  
        [
            { displayName: "Nisheet Jain", phoneNumbers: [{value: "111-111-1111"}]},
            { displayName: "Daniel Lebu" , phoneNumbers: [{value: "222-222-2222"}]},
            { displayName: "Alexander Sher", phoneNumbers: [{value: "333-333-3333"}]}
        ];
    
    var currentTime = new Date();
    $scope.activityTime = (currentTime.getMinutes() <= 30) ? (currentTime.getHours() +1) + ":30" : (currentTime.getHours() +2) + ":00";

    $scope.pickContacts = function(){
        if (!navigator.contacts) {
            $scope.contactsModal.show();
        } else {
            navigator.contacts.find(["*"], function(contacts){
                if (contacts && contacts.length > 0) {
                    $scope.friendsList = contacts;
                }
                $scope.contactsModal.show();
            }, function (err) {
                $scope.contactsModal.show();
            }, {filter: "", multiple: true });
        }
    };

    $scope.deletePicture = function(evt) {
        var removedPicture = evt.target.parentElement.children[1].src;
        var index = $scope.photos.indexOf(removedPicture);
        if (index > -1) {
            $scope.photos.splice(index, 1);
        }        
    };
    $scope.photos = [];
    $scope.addPicture = function(){
        if (navigator.camera) {
            navigator.camera.getPicture(function(imageData) {
                $scope.photos.push("data:image/jpeg;base64,"+imageData);
                $scope.$digest();
            }, function(message) {
            }, { quality: 50,
                 destinationType: Camera.DestinationType.DATA_URL
               });
        }
        else {
            $scope.photos.push("http://emerging-concepts.com/wp-content/uploads/2012/02/Pub-Orlando-Bar.jpg");
            $scope.photos.push("http://www.melissajill.com/uploaded_images/bowling11-750050.jpg");
            $scope.photos.push("http://2.bp.blogspot.com/-CLhsN2qi7g8/T8gR-0nBPrI/AAAAAAAACos/9rYGnl1HwWw/s1600/Movie-Theater-Friends.jpg");
        }
    };
});
