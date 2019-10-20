'use strict'

var d3 = require("d3");

var myData = [
		  {
		    "start": 5,
		    "length": 21
		  },
		  {
		    "start": 38,
		    "length": 15
		  },
		  {
		    "start": 64,
		    "length": 22
		  },
		  {
		    "start": 90,
		    "length": 18
		  },
		  {
		    "start": 112,
		    "length": 64
		  }
		];

var width = 20000, height = 50;

var x = d3.scaleTime().range([0, width]),
x2 = d3.scaleTime().range([0, width]),
y = d3.scaleLinear().range([height, 0]),
y2 = d3.scaleLinear().range([height, 0]);

var timeline = d3.selectAll(".timeline-single")
                  .attr("width", width)
                  .attr("height", height);

timeline.append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", 10)
    .attr("y2", 10);

// var g = timeline.selectAll(".bubble")
//     .data(myData)
//     .enter()
//     .append("rect")
//     .attr("class", "bubble")
//     .attr('x', function(d) {
//       return d.start;
//     })
//     .attr('width', function(d) {
//       return d.length;
//     });

var lengthPerSecond;

d3.csv("./data/s1.csv", type).then(function(data) {
	data
	// if (error) throw error;
	x.domain([parseTime("0:0:0"), d3.max(data, function(d) {
    return d.timestamp
  })])
  y.domain([-100, 100]);
  // x2.domain(x.domain());
  // y2.domain(y.domain());

	var minTime = parseTime("0:0:0")
	var maxTime = d3.max(data, function(d) {
    return d.timestamp
  });

	var maxSeconds = (maxTime.getTime() - minTime.getTime()) / 1000;
	lengthPerSecond = (maxSeconds / width);
	console.log(maxTime);
	console.log(maxSeconds);
	console.log(lengthPerSecond);

	timeline.selectAll(".bubble")
		.data(data)
		.enter()
		.append("rect")
		.attr("class", "bubble")
		.attr('x', function(d, i) {
			return x(d.timestamp);
		})
		.attr('width', function(d) {
			return (d.nWords * lengthPerSecond * 3);
		})
		.attr("fill", function(d) {
			var i = Math.floor(Math.random() * 100);
			if (i < 10) {
				return "red";
			} else if (i > 10 && i < 20) {
				return "yellow";
			} else if (i > 20 && i < 30 ) {
				return "blue";
			}
			return "#DAE0E2";
		});


});

// Function to process the data
function type(d) {
  return {
    index: d.index,
    timestamp: parseTime(d.timestamp),
    utterance: determineUtterance([d.links, d.rechts])[1],
		source: determineUtterance([d.links, d.rechts])[0],
		nWords: numberWords(determineUtterance([d.links, d.rechts])[1])
  };
}

var determineUtterance = function(participants) {
	var index = 1;
	var len = participants.length;
	for (var i = 0; i < len; i++) {
		const p = participants[i];
		if (p.length > 0) {
			return [index, p];
		}
		index++;
	}
	return [0, ""];
}

var numberWords = function(utterance) {
	const wordLength = 5;
	return Math.round((utterance.length/wordLength));
}

var parseTime = d3.timeParse("%H:%M:%S");
