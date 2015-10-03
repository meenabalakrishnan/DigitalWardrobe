angular.module('DigitalStylist.services')
 .factory("nonceGenerator", function () { 
    return function() { 
    	var i = 10;
    	var nonce = '';
    	while (i-- > 0) {
    		var item = (Math.random() * 0x10000) | 0; 
        	nonce += (item + 0x10000).toString(16).substring(1).toUpperCase(); 
    	}
    	return nonce;
    }; 
}) 
.factory('Pedometer', function() {

	var prevAccX = 0;
	var prevAccY = 0;
	var prevAccZ = 0;
	var prevAccTime = 0;

	var minAcc = 0;
	var maxAcc = 0;


	return {
		startListening: function(onStepSuccess, onStepError) {
			if (navigator.accelerometer) {
				var onSuccess = function(acceleration) {
					onStepSuccess(acceleration);
				};

				var options = { frequency: 100 };
				watchID = navigator.accelerometer.watchAcceleration(onSuccess, onStepError, options);
				return watchID;
			}
		},

		stopListening: function(watchID) {
			if (navigator.accelerometer) {
				navigator.accelerometer.clearWatch(watchID);
			}
		}
	}
})

.factory('WorkoutDatabase', function() {
	
	var databaseName = "WorkoutDatabase";
	var databaseVersion = "1.0";
	var databaseDisplayName = "WorkoutDatabase";
	var databaseSize = 204800; //2kB

	return  {
		createWorkout: function(workout, onSaveSuccess, onSaveError) {
			var db = openDatabase(databaseName, databaseVersion, databaseDisplayName, databaseSize);
			db.transaction(function(tx) {
				tx.executeSql('CREATE TABLE IF NOT EXISTS WORKOUTS (id unique, starttime, endtime, steps)');
				tx.executeSql('INSERT INTO WORKOUTS (id, starttime, endtime, steps) VALUES (' + workout.starttime + ',' + workout.starttime + ',' + workout.endtime + ',' + workout.steps + ')');
			}, onSaveError, onSaveSuccess);
		},

		readWorkouts: function(readSuccess, readError, includeEmptyWorkouts) {
			var db = openDatabase(databaseName, databaseVersion, databaseDisplayName, databaseSize);
			db.transaction(function(tx){
				tx.executeSql('CREATE TABLE IF NOT EXISTS WORKOUTS (id unique, starttime, endtime, steps)');
				tx.executeSql('SELECT * FROM WORKOUTS WHERE steps > 0', [], function(tx, results){
					var len = results.rows.length;
					var workoutsArray = [];
					for (var i=0; i<len; i++) {
						var currentWorkout = {};
						currentWorkout.id = results.rows.item(i).id;
						currentWorkout.starttime = results.rows.item(i).starttime;
						currentWorkout.endtime = results.rows.item(i).endtime;
						currentWorkout.steps = results.rows.item(i).steps;

						workoutsArray.push(currentWorkout);
					}

					readSuccess(workoutsArray);

				}, readError);
			}, readError);
		},

		populateDatabase: function() {
			var db = openDatabase(databaseName, databaseVersion, databaseDisplayName, databaseSize);
			db.transaction(function(tx) {
				tx.executeSql('CREATE TABLE IF NOT EXISTS WORKOUTS (id unique, starttime, endtime, steps)');
				tx.executeSql('INSERT INTO WORKOUTS (id, starttime, endtime, steps) VALUES (1415199600000, 1415199600000, 1415204000000, 7458)');
				tx.executeSql('INSERT INTO WORKOUTS (id, starttime, endtime, steps) VALUES (1415325600000, 1415325600000, 1415331000000, 6258)');
				tx.executeSql('INSERT INTO WORKOUTS (id, starttime, endtime, steps) VALUES (1415476800000, 1415476800000, 1415482200000, 9456)');
			}, null, null);
		},

		readSevenDaysCount: function(readSuccess, readError) {
			var db = openDatabase(databaseName, databaseVersion, databaseDisplayName, databaseSize);
			var sevenDaysAgoMilliseconds = new Date().getTime() - 7 * 24 * 3600 * 1000;
			db.transaction(function(tx){

				tx.executeSql('CREATE TABLE IF NOT EXISTS WORKOUTS (id unique, starttime, endtime, steps)');
				tx.executeSql('SELECT * FROM WORKOUTS WHERE starttime >= ' + sevenDaysAgoMilliseconds, [], function(tx, results){
					readSuccess(results.rows.length);
				}, readError);
			}, readError);
		}
	}
})
.factory('yelpService', ['$resource', 'nonceGenerator', function($resource, nonceGenerator) {

    var apiHost = 'http://api.yelp.com';
    var searchPath = '/v2/search';

    var sign = function (url, parameters) {
    	var oauthConsumerKey = 'WttMAkgU-u5bJRFeGXnGtA'; 
    	var oauthToken = 'SRHo63zlEleA8WDiKVBmgyh-3yCIdZ0-';
    	var oauthConsumerSecret = 'jG-7MgmFP6gtXAe0KuruV7x8o7Q';
    	var oauthTokenSecret = 'Ab2LuQAnTg3FJkaGOT0BPF9EuoU';
    	var timestamp = Date.now();
	    var nonce = nonceGenerator();

    	parameters['oauth_consumer_key'] = oauthConsumerKey; 
		parameters['oauth_token'] = oauthToken; 
		parameters['oauth_signature_method'] = 'HMAC-SHA1';
		parameters['oauth_timestamp'] = timestamp;
		parameters['oauth_nonce'] = nonce;
		parameters['oauth_version'] = '1.0';

		var signature = oauthSignature.generate('GET', url, parameters, oauthConsumerSecret, oauthTokenSecret);
		parameters['oauth_signature'] = signature;

		return parameters;
    };

    var yelpSearchResource = $resource(apiHost+searchPath, {});

    var yelpService = {
    	search: function(term, address, limit) {

	        var parameters = { 

		        'term':term,
		        'location':address,
		        'limit':limit
		    };

		    return yelpSearchResource.get(sign(apiHost+searchPath, parameters));
    	},

    	searchLocation : function(term, latitude, longitude, limit) {
    		var parameters = { 
		        'term':term,
		        'll':latitude+','+longitude,
		        'limit':limit
		    };

		    return yelpSearchResource.get(sign(apiHost+searchPath, parameters));
    	}
    }

    return yelpService;
}]);
