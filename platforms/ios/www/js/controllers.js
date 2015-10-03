angular.module('DigitalStylist.controllers')

.controller('WorkoutController', function($scope, Pedometer, WorkoutDatabase) {
	
	/* Scope */

	$scope.workoutSpeed = 0;
	$scope.workoutSeconds = "00";
	$scope.workoutMinutes = "00";
	$scope.workoutSteps = 0;
	$scope.workoutAccX = 0;
	$scope.workoutAccY = 0;
	$scope.workoutAccZ = 0;

	$scope.startWorkout = function() {
		if (!workoutActive) {
			var currentTime = new Date().getTime();
			currentWorkout.id = currentTime;
			currentWorkout.starttime = currentTime;
			workoutActive = true;
			workoutTimerId = window.setInterval(updateTimer, 1000);
			workoutPedometerId = Pedometer.startListening(onStepSuccess, onStepError);
		}
	},

	$scope.endWorkout = function() {
		if (workoutActive) {
			workoutActive = false;
			window.clearInterval(workoutTimerId);
			Pedometer.stopListening(workoutPedometerId);

			// save the workout to the DB
			currentWorkout.endtime = new Date().getTime();
			currentWorkout.steps = $scope.workoutSteps;
			WorkoutDatabase.createWorkout(currentWorkout, function() {
				console.log("success");
			}, function() {
				console.log("error");
			});
		}
	};

	/* Local */

	var maxint = 9007199254740992;
	var minint = -maxint;
	var minStepDelta = 2;

	var workoutTotalSeconds = 0;
	var workoutActive = false;
	var workoutTimerId = 0;
	var workoutPedometerId = 0;

	var minX = 0;
	var maxX = 0;
	var medianX = 0;

	var minY = 0;
	var maxY = 0;
	var medianY = 0;

	var minZ = 0;
	var maxZ = 0;
	var medianZ = 0;

	var samples = 0;

	var previousAccX = 0;
	var previousAccY = 0;
	var previousAccZ = 0;

	var previousStepTimestamp = 0;
	var stepsInPastInterval = 0;
	var speedIntervalInSeconds = 5;
	var currentWorkout = {};

	var updateTimer = function() {
		workoutTotalSeconds = workoutTotalSeconds + 1;

		if (workoutTotalSeconds % speedIntervalInSeconds == 0) {
			$scope.workoutSpeed = Math.floor((60 / speedIntervalInSeconds) * stepsInPastInterval);
			stepsInPastInterval = 0;
		}

		if (!navigator.accelerometer) {
			window.setTimeout(updateStepCount, 250 + Math.floor(250 * Math.random()));
			window.setTimeout(updateStepCount, 750 + Math.floor(250 * Math.random()));
		}

		$scope.workoutMinutes = addLeadingZero(Math.floor(workoutTotalSeconds / 60));
		$scope.workoutSeconds = addLeadingZero(workoutTotalSeconds % 60);
		$scope.$digest();
	};

	var addLeadingZero = function(value) {
		if (value < 10) {
			return "0" + value;
		}
		return value;
	};

	var onStepSuccess = function(acceleration) {
		samples = samples + 1;

		if (samples % 50 == 0) {
			minX = maxint;
			minY = maxint;
			minZ = maxint;

			maxX = minint;
			maxY = minint;
			maxZ = minint;
		}

		if (minX > acceleration.x) {
			minX = acceleration.x;
		}

		if (minY > acceleration.y) {
			minY = acceleration.y;
		}

		if (minZ > acceleration.z) {
			minZ = acceleration.z;
		}

		if (maxX < acceleration.x) {
			maxX = acceleration.x;
		}

		if (maxY < acceleration.y) {
			maxY = acceleration.y;
		}

		if (maxZ < acceleration.z) {
			maxZ = acceleration.z;
		}

		medianX = (maxX + minX) / 2;
		medianY = (maxY + minY) / 2;
		medianZ = (maxZ + minZ) / 2;

		var xDelta = Math.abs(acceleration.x - previousAccX);
		var yDelta = Math.abs(acceleration.y - previousAccY);
		var zDelta = Math.abs(acceleration.z - previousAccZ);

		// determine the largest difference in acceleration
		var maxIndex = getMaxIndex(xDelta, yDelta, zDelta);
		switch (maxIndex) {
			// X
			case 0:
			if (xDelta > minStepDelta && isStep(previousAccX, acceleration.x, medianX, acceleration.timestamp)) {
				previousStepTimestamp = acceleration.timestamp;
				updateStepCount()
			}
			break;

			// Y
			case 1:
			if (yDelta > minStepDelta && isStep(previousAccY, acceleration.y, medianY, acceleration.timestamp)) {
				previousStepTimestamp = acceleration.timestamp;
				updateStepCount()
			}
			break;

			// Z
			case 2:
			if (zDelta > minStepDelta && isStep(previousAccZ, acceleration.z, medianZ, acceleration.timestamp)) {
				previousStepTimestamp = acceleration.timestamp;
				updateStepCount()
			}
			break;
		}

		previousAccX = acceleration.x;
		previousAccY = acceleration.y;
		previousAccZ = acceleration.z;	
	};

	var onStepError = function() {
		$scope.workoutSteps = -99;
		$scope.$digest();
	};

	var updateStepCount = function() {
		stepsInPastInterval = stepsInPastInterval + 1;
		$scope.workoutSteps = $scope.workoutSteps + 1;
		$scope.$digest();
	}

	var isStep = function(previousAcc, currentAcc, median, timestamp) {
		return !!(timestamp - previousStepTimestamp > 200 && previousAcc > median && currentAcc < median);
	};

	// Gets the index of the maximum number from the passed parameters
	var getMaxIndex = function(first, second, third) {
		var i = 0;
		var max = minint;
		var maxIndex = 0;

		for (i = 0; i < arguments.length; i++) {
			if (arguments[i] > max) {
				maxIndex = i;
				max = arguments[i];
			}
		}

		return maxIndex;
	};

})

.controller('StatisticsController', function($scope, WorkoutDatabase) {

	var computeAvgStep = function(workout) {
		var millisecondsDuration = workout.endtime - workout.starttime;
		return Math.floor(workout.steps / (millisecondsDuration / 60 / 1000));
	};

	var getFormattedDate = function(milliseconds) {
		
		var m_names = new Array("Jan", "Feb", "Mar", 
			"Apr", "May", "Jun", "Jul", "Aug", "Sep", 
			"Oct", "Nov", "Dec");

		var d = new Date(milliseconds);
		var curr_date = d.getDate();
		var curr_month = d.getMonth();
		var curr_year = d.getFullYear();

		return m_names[curr_month] + "-" +  curr_date +"-" + curr_year;
	};

	var getDayOfWeek = function(milliseconds) {
		var d_names = ["Sunday","Monday", "Tuesday", "Wednesday", 
		"Thursday", "Friday", "Saturday"];

		var d = new Date(milliseconds);
		return d_names[d.getDay()];

	};

	var drawStatisticsCharts = function(workouts) {
		// first chart - workout steps

		var data = new google.visualization.DataTable();
		data.addColumn('string', 'Date');
		data.addColumn('number', 'Steps');

		for (var i = 0; i < workouts.length; i++) {
			data.addRow([""+getFormattedDate(workouts[i].starttime), workouts[i].steps]);
		}

        // Instantiate and draw our chart, passing in some options.
        var chart = new google.visualization.BarChart(document.getElementById('chart_div'));
        chart.draw(data);

        // second chart - workout steps per minute (average)
        var data2 = new google.visualization.DataTable();
        data2.addColumn('string', 'Date');
        data2.addColumn('number', 'Steps per minute');

        for (var i = 0; i < workouts.length; i++) {
        	data2.addRow([""+getFormattedDate(workouts[i].starttime), computeAvgStep(workouts[i])]);
        }

        // Instantiate and draw our chart, passing in some options.
        var chart2 = new google.visualization.BarChart(document.getElementById('chart_div_2'));
        chart2.draw(data2);


        // third chart - workout day of the week
        var data3 = new google.visualization.DataTable();
        data3.addColumn('string', 'Day of week');
        data3.addColumn('number', 'Workout percentage');

        var weekDayWorkouts = {};

        for (var i = 0; i < workouts.length; i++) {
        	var workoutDayOfWeek = getDayOfWeek(workouts[i].starttime);
        	if (weekDayWorkouts[workoutDayOfWeek]) {
        		weekDayWorkouts[workoutDayOfWeek] = weekDayWorkouts[workoutDayOfWeek] + 1;
        	}
        	else {
        		weekDayWorkouts[workoutDayOfWeek] = 1;
        	}
        }

        for (var weekday in weekDayWorkouts) {
        	data3.addRow([weekday, Math.floor(100 * weekDayWorkouts[weekday] / 7)]);
        }

        // Instantiate and draw our chart, passing in some options.
        var chart3 = new google.visualization.PieChart(document.getElementById('chart_div_3'));
        chart3.draw(data3);
    };

    $scope.initStatistics = function() {

    	var statisticsError = function(){
    		console.log("error reading data");
    	};

		// Read the workout data
		WorkoutDatabase.readWorkouts(function(workouts){

			// if there is no data, populate and call draw one more time
			if (workouts.length == 0) {
				WorkoutDatabase.populateDatabase();
				WorkoutDatabase.readWorkouts(drawStatisticsCharts, statisticsError);
				return;
			}

			drawStatisticsCharts(workouts);

		}, statisticsError);
	};

})

.controller('GymController', function($scope, WorkoutDatabase) {
	$scope.initCheckin = function() {

		var displaySevenDaysCount = function(count) {
			$scope.gymcount = count;
			$scope.$digest;
		};

		WorkoutDatabase.readSevenDaysCount(displaySevenDaysCount, function() {
			console.log("error");
		});
	};

	$scope.checkin = function() {
		var fakeWorkout = {};
		$scope.gymcount = $scope.gymcount + 1;
		$scope.$digest;
		fakeWorkout.id = new Date().getTime();
		fakeWorkout.starttime = fakeWorkout.id;
		fakeWorkout.endtime = fakeWorkout.starttime;
		fakeWorkout.steps = 0;
		WorkoutDatabase.createWorkout(fakeWorkout, function() {
			console.log("success");
		}, function() {
			console.log("error");
		});
	};
})

.controller('RestaurantCtrl', ['$scope', '$stateParams', 'yelpService', function($scope, $stateParams, yelpService) {
	var update = function (name) { 
		if (!name) {
			name = 'food';
		}
		if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
            	$scope.model = yelpService.searchLocation(name, position.coords.latitude, position.coords.longitude, 10); 
            }, function onError(error) {
                $scope.model = yelpService.searchLocation(name, 47.644117,-122.129444, 10); 
            });
            
        } else {
            //default to Building 18
            $scope.model = yelpService.searchLocation(name, 47.644117,-122.129444, 10); 
        }
    };

    $scope.update = function(name) {
    	update(name);
    };

    update($stateParams.term);
}])

.controller('HomeController', function($scope) {

	var DAY_MOMENT_DAWN = "at dawn";
	var DAY_MOMENT_MORNING = "morning";
	var DAY_MOMENT_MID_MORNING = "mid-morning";
	var DAY_MOMENT_NOON = "noon";
	var DAY_MOMENT_AFTER_NOON = "after-noon";
	var DAY_MOMENT_EVENING = "evening";
	var DAY_MOMENT_NIGHT = "night";

	var DAY_OF_WEEK_MONDAY = "Monday";
	var DAY_OF_WEEK_TUESDAY = "Tuesday";
	var DAY_OF_WEEK_WEDNESDAY = "Wednesday";
	var DAY_OF_WEEK_THURSDAY = "Thursday";
	var DAY_OF_WEEK_FRIDAY = "Friday";
	var DAY_OF_WEEK_SATURDAY = "Saturday";
	var DAY_OF_WEEK_SUNDAY = "Sunday";

	var WORKOUT_ACTIVITY_WALK = {title: "Going for a walk", icon: "ion-ios7-paw", url:"gym"};
	var WORKOUT_ACTIVITY_RUN = {title: "Going for a run", icon: "ion-ios7-loop-strong", url:"gym"};
	var WORKOUT_ACTIVITY_GYM = {title: "Going to the gym", icon: "ion-happy", url:"gym"};

	var SEARCH_ACTIVITY_DINNER = {title: "Dining out", icon: "ion-ios7-wineglass", url:"restaurant/restaurant"};
	var SEARCH_ACTIVITY_BREAKFAST = {title: "Having breakfast", icon: "ion-pizza", url:"restaurant/pizza"};
	var SEARCH_ACTIVITY_LUNCH = {title: "Having lunch", icon: "ion-fork", url:"restaurant/lunch"};
	var SEARCH_ACTIVITY_COFFEE = {title: "A coffee break", icon: "ion-coffee", url:"restaurant/coffee"};
	var SEARCH_ACTIVITY_TEA = {title: "Having a tea break", icon: "ion-coffee", url:"restaurant/tea"};

	var MEET_ACTIVITY_MOVIE = {title: "Seeing a movie", icon: "ion-eye", url:"party/Guys let's see a movie today"};
	var MEET_ACTIVITY_BOWLING = {title: "Bowling with friends", icon: "ion-ios7-circle-filled", url:"party/Let's go Bowling"};
	var MEET_ACTIVITY_GOLF = {title: "Golfing with friends", icon: "ion-ios7-circle-outline", url:"party/Guys, interested in Golf??"};
	var MEET_ACTIVITY_CART = {title: "A quick kart race", icon: "ion-model-s", url:"party/Let's go Karting"};
	var MEET_ACTIVITY_HIKING = {title: "Going hiking", icon: "ion-android-friends", url:"party/Let's do some hiking today"};
	var MEET_ACTIVITY_SNOWBOARDING = {title: "Hitting the slopes", icon: "ion-ios7-snowy", url:"party/Let's hit the slopes"};

	var allWorkoutActivities = [WORKOUT_ACTIVITY_WALK, WORKOUT_ACTIVITY_RUN, WORKOUT_ACTIVITY_GYM];
	var allSearchActivities = [SEARCH_ACTIVITY_DINNER, SEARCH_ACTIVITY_BREAKFAST, SEARCH_ACTIVITY_LUNCH, SEARCH_ACTIVITY_COFFEE, SEARCH_ACTIVITY_TEA];
	var allMeetingActivities = [MEET_ACTIVITY_MOVIE, MEET_ACTIVITY_BOWLING, MEET_ACTIVITY_GOLF, MEET_ACTIVITY_CART, MEET_ACTIVITY_HIKING, MEET_ACTIVITY_SNOWBOARDING];

	var getRandomIntLessThan = function(n) {
		return Math.floor(n * Math.random());
	};

	var getDayMoment = function(hours) {
		switch (hours) {
			case 0:
			case 1:
			case 2:
			case 3:
			case 4:
			case 5:
			return DAY_MOMENT_DAWN;
			case 6:
			case 7:
			case 8:
			return DAY_MOMENT_MORNING;
			case 9:
			case 10:
			case 11:
			return DAY_MOMENT_MID_MORNING;
			case 12:
			return DAY_MOMENT_NOON;
			case 13:
			case 14:
			case 15:
			case 16:
			return DAY_MOMENT_AFTER_NOON;
			case 17:
			case 18:
			case 19:
			case 20:
			case 21:
			return DAY_MOMENT_EVENING;
			case 22:
			case 23:
			return DAY_MOMENT_NIGHT;
		}
	};

	var isWeekend = function(weekday) {
		return (weekday == DAY_OF_WEEK_SATURDAY || weekday == DAY_OF_WEEK_SUNDAY);
	};

	var getWorkoutActivitySuggestion = function(weekday, dayMoment) {
		// weekday, before work
		if ((!isWeekend(weekday)) && (dayMoment == DAY_MOMENT_DAWN || dayMoment == DAY_MOMENT_MORNING)) {
			return WORKOUT_ACTIVITY_RUN;
		}

		// weekday, after work
		if ((!isWeekend(weekday)) && (dayMoment == DAY_MOMENT_EVENING || dayMoment == DAY_MOMENT_NIGHT)) {
			return WORKOUT_ACTIVITY_GYM;
		}

		// weekday, during work hours
		if ((!isWeekend(weekday)) && (dayMoment == DAY_MOMENT_MID_MORNING || dayMoment == DAY_MOMENT_NOON || dayMoment == DAY_MOMENT_AFTER_NOON)) {
			return WORKOUT_ACTIVITY_WALK;
		}

		return allWorkoutActivities[getRandomIntLessThan(allWorkoutActivities.length)];
	};

	var getMeetingActivitySuggestion = function(weekday, dayMoment) {
		// weekday, before work
		if ((!isWeekend(weekday)) && (dayMoment == DAY_MOMENT_DAWN || dayMoment == DAY_MOMENT_MORNING)) {
			return MEET_ACTIVITY_HIKING;
		}

		// weekday, during work hours
		if ((!isWeekend(weekday)) && (dayMoment == DAY_MOMENT_AFTER_NOON || dayMoment == DAY_MOMENT_MID_MORNING || dayMoment == DAY_MOMENT_NOON)) {
			return MEET_ACTIVITY_CART;
		}

		return allMeetingActivities[getRandomIntLessThan(allMeetingActivities.length)];
	};

	var getSearchingActivitySuggestion = function(weekday, dayMoment) {
		// weekday, breakfast time
		if ((!isWeekend(weekday)) && (dayMoment == DAY_MOMENT_DAWN || dayMoment == DAY_MOMENT_MORNING)) {
			return SEARCH_ACTIVITY_BREAKFAST;
		}

		// weekday, mid morning
		if ((!isWeekend(weekday)) && (dayMoment == DAY_MOMENT_MID_MORNING)) {
			return SEARCH_ACTIVITY_BREAKFAST;
		}

		// weekday, dinner time
		if ((!isWeekend(weekday)) && (dayMoment == DAY_MOMENT_EVENING)) {
			return SEARCH_ACTIVITY_DINNER;
		}

		// weekday, lunch time
		if ((!isWeekend(weekday)) && (dayMoment == DAY_MOMENT_NOON)) {
			return SEARCH_ACTIVITY_LUNCH;
		}

		// weekday, after noon
		if ((!isWeekend(weekday)) && (dayMoment == DAY_MOMENT_AFTER_NOON)) {
			return SEARCH_ACTIVITY_COFFEE;
		}

		return allSearchActivities[getRandomIntLessThan(allSearchActivities.length)];
	};

	$scope.initTimeOfDay = function() {
		var currentDate = new Date();

		// get weekday
		var day_names = [DAY_OF_WEEK_SUNDAY, DAY_OF_WEEK_MONDAY, DAY_OF_WEEK_TUESDAY, DAY_OF_WEEK_WEDNESDAY, DAY_OF_WEEK_THURSDAY, DAY_OF_WEEK_FRIDAY, DAY_OF_WEEK_SATURDAY];
		var weekday = day_names[currentDate.getDay()];
		$scope.dayOfWeek = weekday;

		// get time of day
		var hours = currentDate.getHours();
		var dayMoment = getDayMoment(hours);
		$scope.dayMoment = dayMoment;

		// initialize suggested activities
		var searchActivitySuggestion = getSearchingActivitySuggestion(weekday, dayMoment);
		var meetActivitySuggestion = getMeetingActivitySuggestion(weekday, dayMoment);
		var workoutActivitySuggestion = getWorkoutActivitySuggestion(weekday, dayMoment);

		$scope.suggestedActivities = [];
		$scope.suggestedActivities.push(searchActivitySuggestion);
		$scope.suggestedActivities.push(meetActivitySuggestion);
		$scope.suggestedActivities.push(workoutActivitySuggestion);

		// initialize all activities - don't include suggested items
		$scope.allActivities = [];
		for (var i = 0; i < allSearchActivities.length; i++) {
			if (allSearchActivities[i].title !== searchActivitySuggestion.title) {
				$scope.allActivities.push(allSearchActivities[i]);
			}
		}

		for (var i = 0; i < allWorkoutActivities.length; i++) {
			if (allWorkoutActivities[i].title != workoutActivitySuggestion.title) {
				$scope.allActivities.push(allWorkoutActivities[i]);
			}
		}

		for (var i = 0; i < allMeetingActivities.length; i++) {
			if (allMeetingActivities[i].title != meetActivitySuggestion.title) {
				$scope.allActivities.push(allMeetingActivities[i]);
			}
		}

		shuffleArray($scope.allActivities);
	};

	var shuffleArray = function(array) {
		var currentIndex = array.length, temporaryValue, randomIndex ;

		  while (0 !== currentIndex) {

		    randomIndex = Math.floor(Math.random() * currentIndex);
		    currentIndex -= 1;

		    temporaryValue = array[currentIndex];
		    array[currentIndex] = array[randomIndex];
		    array[randomIndex] = temporaryValue;
		}

		return array;
	};
});