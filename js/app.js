'use strict';

var username = '';

$(document).ready(function() {
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			// User is signed in.
			username = user.email.split('@')[0];
		} else {
			// No user is signed in.
			var options = {
				backdrop: 'static',
				keyboard: false,
				focus: true,
				show: true
			}
			$('#login').modal(options);
		}
	});
});

var canvas = $('#test-box');
canvas.attr('height', $(window).height() - 100);
canvas.attr('width', $(window).width() - 100);

var ctx = canvas[0].getContext('2d');

var bounds = {
	x: parseInt(canvas.attr('width')),
	y: parseInt(canvas.attr('height'))
};

var radius = 30;

var database = firebase.database();
var databaseRef = database.ref();
// Create a child reference
var resultsRef = databaseRef.child('results');

$('#login-form').on('submit', function(event) {

   var email = $('#email').val();
   var password = $('#password').val();
   loginAccount(email, password);

   //don't submit as usual!
   event.preventDefault();    //current standard
   event.returnValue = false; //some older browsers
   return false;              //most older browsers

});

var tryLogin = function() {
	return false;
}

var createAccount = function(email, password) {
	firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
		// Handle Errors here.
		var errorCode = error.code;
		var errorMessage = error.message;
	});
}

var loginAccount = function(email, password) {
	firebase.auth().signInWithEmailAndPassword(email + '@omg.com', password).then(function(data) {
		$('#login').modal('hide');
	}).catch(function(error) {
		// Handle Errors here.
		var errorCode = error.code;
		var errorMessage = error.message;
	});
}

var logoutAccount = function() {
	firebase.auth().signOut().then(function() {
		// Sign-out successful.
		}, function(error) {
		// An error happened.
	});
}

var addResults = function(resultData, accuracyData, errorData) {

	var newResultKey = resultsRef.push().key;

	resultsRef.child(username).once('value').then(function(snapshot) {
		var size = snapshot.numChildren();
		
		var updates = {};
		updates[username + '/' + size] = {time: resultData, accuracy: accuracyData, errors: errorData};
		return resultsRef.update(updates);
	});
}

function updateCounter(amt) {
	databseRef.child('/counts/' + username).transaction(function(currentValue) {
		currentValue || (currentValue === 0); // can be null
		return currentValue + amt;
	});
}

var xscale = function(x) {
	if (x >= 0 && x <= 100) {
		return (x / 100) * (bounds.x - (2 * radius)) + radius;
	} else {
		return undefined;
	}
}

var yscale = function(y) {
	if (y >= 0 && y <= 100) {
		return (y / 100) * (bounds.y - (2 * radius)) + radius;
	} else {
		return undefined;
	}
}

var makeCircle = function(x, y) {
	ctx.beginPath();
	ctx.arc(xscale(x), yscale(y), radius, 0, 2 * Math.PI);
	ctx.closePath();
	ctx.strokeStyle = '#000000';
	ctx.fillStyle = '#000000';
	ctx.fill();
	ctx.beginPath();
	ctx.arc(xscale(x), yscale(y), radius / 10, 0, 2 * Math.PI);
	ctx.closePath();
	ctx.strokeStyle = '#FF0000';
	ctx.fillStyle = '#FF0000';
	ctx.fill();
}

var removeCircle = function(x, y) {
	ctx.beginPath();
	ctx.arc(xscale(x), yscale(y), radius + 1, 0, 2 * Math.PI);
	ctx.closePath();
	ctx.strokeStyle = '#ffffff';
	ctx.fillStyle = '#ffffff'
	ctx.fill();
}

var beginTest = function() {
	ctx.textAlign = 'center'
	ctx.strokeStyle = '#000000';
	ctx.fillStyle = '#000000';
	ctx.font = '160px Georgia';
	ctx.fillText('Press Below to Begin', xscale(50), yscale(30));
	makeCircle(50, 50);
}

var removeBegin = function() {
	ctx.fillStyle = '#FFFFFF';
	ctx.fillRect(xscale(0), yscale(0), xscale(100), yscale(100));
}

var endTest = function() {
	ctx.textAlign = 'center'
	ctx.strokeStyle = '#000000';
	ctx.fillStyle = '#000000';
	ctx.font = '160px Georgia';
	ctx.fillText('Thank You For', xscale(50), yscale(30));
	ctx.fillText('Participating', xscale(50), yscale(60));
}

// var randoms = '[';

// for (var i = 0; i < 20; i++) {
// 	var first = Math.floor(Math.random() * 100);
// 	var second = Math.floor(Math.random() * 100);
// 	randoms += '[' + first + ', ' + second + '],';
// }

// randoms += ']';

// console.log(randoms);

var start = true;

var index = -1;
var points = [[68, 0],[90, 50],[47, 50],[4, 77],[69, 76],[32, 72],[29, 46],[50, 66],[58, 49],[13, 16],[34, 53],[44, 26],[24, 22],[32, 73],[31, 7],[77, 59],[97, 80],[24, 20],[41, 42],[0, 8]];
// points = [[68, 0]];

var circle = [50, 50];
// makeCircle(circle[0], circle[1]);

var times = [];
var accuracy = [];
var errors = {count: 0, distance: []};
var timeBegin;
var timeEnd;

canvas.click(function(e) {
	var x = e.pageX - parseInt(canvas.css('margin-left'));
	var y = e.pageY - parseInt(canvas.css('margin-top'));
	var distance = Math.sqrt(Math.pow(x - xscale(circle[0]), 2) + Math.pow(y - yscale(circle[1]), 2));
	if (distance < radius) {
		if (start) {
			removeBegin();
		}
		removeCircle(circle[0], circle[1]);
		index++;
		timeEnd = new Date().getTime();
		var diff = timeEnd - timeBegin;
		if (!isNaN(diff)) {
			times.push(diff);
			accuracy.push(distance);
		}
		timeBegin = timeEnd;
		if (index >= points.length) {
			endTest();
			addResults(times, accuracy, errors);
		} else {
			circle = points[index];
			makeCircle(circle[0], circle[1]);
		}
	} else {
		errors.count++;
		errors.distance.push(distance - radius);
	}
});

beginTest();