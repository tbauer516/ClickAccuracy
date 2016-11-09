'use strict';

var username = '';

$(document).ready(function() {
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			// User is signed in.
			username = user.email.split('@')[0];
			getData();
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

var database = firebase.database();
var databaseRef = database.ref();
// Create a child reference
var resultsRef = databaseRef.child('results');
var countsRef = databaseRef.child('counts');

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

var getData = function() {
	// resultsRef.child(username).once('value').then(function(snapshot) {
	// 	data = snapshot.val();
	// 	processData(data);
	// });
	var data = [];
	resultsRef.child(username).on('child_added', function(snapshot) {
		data.push(snapshot.val());
		processData(data);
	});
}

var processData = function(data) {

	var newData = [];
	
	for (var i = 0; i < data.length; i++) {
		var timeValues = [];
		var accuracyValues = [];
		var distanceValues = [];
		var errorValues = [];
		var timeOverDistance = [];
		var accuracyOverDistance = [];
		var errorOverDistance = [];
		for (var j = 0; j < data[i].time.length; j++) {
			var timeItem = {
				click: j + 1,
				time: data[i].time[j]
			};
			var accuracyItem = {
				click: j + 1,
				accuracy: data[i].accuracy[j]
			};
			var distanceItem = {
				click: j + 1,
				distance: data[i].distance[j]
			};
			var timeDistanceItem = {
				click: j + 1,
				timeOverDistance: data[i].time[j] / data[i].distance[j]
			};
			var accuracyDistanceItem = {
				click: j + 1,
				accuracyOverDistance: data[i].accuracy[j] / data[i].distance[j]
			};
			timeValues.push(timeItem);
			accuracyValues.push(accuracyItem);
			distanceValues.push(distanceItem);
			timeOverDistance.push(timeDistanceItem);
			accuracyOverDistance.push(accuracyDistanceItem);
		}
		if (data[i].errors != undefined) {
			for (var j = 0; j < data[i].errors.length; j++) {
				var clickNumber = data[i].errors[j].click;
				var errorDistanceItem = {
					click: clickNumber,
					errorOverDistance: data[i].errors[j].error / data[i].distance[clickNumber]
				};
				errorValues.push(data[i].errors[j]);
				errorOverDistance.push(errorDistanceItem);
			}	
		}
		newData.push({
			id: i,
			timeData: timeValues,
			accuracyData: accuracyValues,
			distanceData: distanceValues,
			errorData: errorValues,
			timeDistance: timeOverDistance,
			accuracyDistance: accuracyOverDistance,
			errorDistance: errorOverDistance
		});
	}

	lineGraph('#chart1', newData, 'timeData', 'click', 'time', 'Time in milliseconds between clicks');
	lineGraph('#chart2', newData, 'accuracyData', 'click', 'accuracy', 'Distance in pixels from the center of target');
	lineGraph('#chart3', newData, 'timeDistance', 'click', 'timeOverDistance', 'Time in ms / Distance in px');
	lineGraph('#chart4', newData, 'accuracyDistance', 'click', 'accuracyOverDistance', 'Accuracy in px / Distance in px');

}

var lineGraph = function(chartID, data, dataset, x, y, ylabel) {

	var chart = $(chartID);
	chart.height(chart.innerWidth() * (9 / 16));
	$(chartID + ' svg').remove();
	var d3chart = d3.select(chartID);
	var svg = d3chart.append('svg');
	svg.attr('width', parseInt(d3chart.style('width')));
	svg.attr('height', parseInt(d3chart.style('height')));
	var margin = {top: 20, right: 80, bottom: 30, left: 50};
	var width = svg.attr('width') - (margin.left + margin.right);
	var height = svg.attr('height') - (margin.top + margin.bottom);
	var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	var xdomain = [
		0,
		d3.max(data, function(s) {
			return s[dataset].length;
		}) + 1
	];

	var ydomain = [
		d3.min(data, function(s) {
			return d3.min(s[dataset], function(d) {
				return d[y];
			});
		}),
		d3.max(data, function(s) {
			return d3.max(s[dataset], function(d) {
				return d[y];
			});
		})
	];

	var xscale = d3.scaleLinear()
		.domain(xdomain)
		.range([0, width]);

	var yscale = d3.scaleLinear()
		.domain(ydomain)
		.range([height, 0]);

	var zscale = d3.scaleOrdinal(d3.schemeCategory10)
		.domain(data.map(function(s) { return s.id; }));

	var colorscale = d3.scaleLinear()
		.domain([0, data.length - 1])//.domain(data.map(function(s) { return s.id; }))
		.range([0, 0.85]);

	var getColor = function(d) {
		return d3.interpolateRainbow(colorscale(d));
	}

	var line = d3.line()
    	.curve(d3.curveBasis)
    	.x(function(d) { return xscale(d[x]); })
    	.y(function(d) { return yscale(d[y]); });

	var legend = svg.append('g')
		.attr('class', 'legend')
		.attr('x', width - 100)
		.attr('y', 100)
		.attr('height', 100)
		.attr('width', 100);

	legend.selectAll('g')
		.data(data)
	.enter().append('g')
		.each(function(d, i) {
			var xpos = width - 100;
			var ypos = 25;
			var yoffset = 25
			var g = d3.select(this);
			g.append('rect')
			.attr('x', xpos)
			.attr('y', i * ypos + yoffset)
			.attr('width', 10)
			.attr('height', 10)
			.style('fill', function(d) {
				return getColor(d.id);
			});

	g.append('text')
		.attr('x', xpos + 15)
		.attr('y', i * ypos + 10 + yoffset)
		.attr('height',30)
		.attr('width',100)
		.style('fill', function(d) {
			return getColor(d.id);
		})
		.text(function(d) {
			return 'Mean: ' + d3.mean(d[dataset], function(d) {
				return d[y];
			}).toFixed(2) + ' | STD: ' + d3.deviation(d[dataset], function(d) {
				return d[y];
			}).toFixed(2);
		});

	});

    g.append('g')
		.attr('class', 'axis axis--x')
		.attr('transform', 'translate(0,' + height + ')')
		.call(d3.axisBottom(xscale))
	.append('text')
		.attr('x', width - 50)
		.attr('dy', '-5px')
		.attr('fill', '#000000')
		.style('font-size', '10pt')
		.text('Target number');

	g.append('g')
		.attr('class', 'axis axis--y')
		.call(d3.axisLeft(yscale))
	.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', 6)
		.attr('dy', '0.71em')
		.attr('fill', '#000000')
		.style('font-size', '10pt')
		.text(ylabel);

	var subject = g.selectAll('.subject')
		.data(data)
	.enter().append('g')
		.attr('class', 'subject');

	subject.append('path')
		.attr('class', 'line')
		.attr('d', function(d) { return line(d[dataset]); })
		.style('stroke', function(d) {
			return getColor(d.id);
		});
}