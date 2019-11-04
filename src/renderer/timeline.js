'use strict'

var d3 = require("d3");

var inference_types = [
  [0, "Deduction", "silver"],
  [1, "Induction", "gray"],
  [2, "Regressive1", "red"],
  [3, "Regressive2", "orange"],
  [4, "Effect", "yellow"],
  [5, "Idea", "green"],
  [6, "Composition1", "brown"],
  [7, "Composition2", "blue"],
  [8, "Manipulative", "purple"],
  [9, "Transformation", "black"],
  [10, "Analogical", "pink"],
  [11, "Requirements", "olive"],
  [12, "Prioritisation1", "teal"],
  [13, "Prioritisation2", "maroon"],
	[14, "None", "hsl(0, 0%, 96%)"]
];

var svg = d3.select("svg"),
  margin = {
    top: 20,
    right: 20,
    bottom: 110,
    left: 40
  },
  margin2 = {
    top: 430,
    right: 20,
    bottom: 30,
    left: 40
  },
  width = +svg.attr("width") - margin.left - margin.right,
  height = +svg.attr("height") - margin.top - margin.bottom,
  height2 = +svg.attr("height") - margin2.top - margin2.bottom;

var parseTime = d3.timeParse("%H:%M:%S");
var formatTime = d3.timeFormat("%H:%M:%S");

var x = d3.scaleTime().range([0, width]),
  x2 = d3.scaleTime().range([0, width]),
  y = d3.scaleLinear().range([height, 0]),
  y2 = d3.scaleLinear().range([height2, 0]);

var xAxis = d3.axisBottom(x).tickFormat(formatTime),
  xAxis2 = d3.axisBottom(x2).tickFormat(formatTime),
  yAxis = d3.axisLeft(y);

var brush = d3.brushX()
  .extent([
    [0, 0],
    [width, height2]
  ])
  .on("brush end", brushed);

var zoom = d3.zoom()
  .scaleExtent([1, Infinity])
  .translateExtent([
    [0, 0],
    [width, height]
  ])
  .extent([
    [0, 0],
    [width, height]
  ])
  .on("zoom", zoomed);

var area = d3.area()
  .curve(d3.curveMonotoneX)
  .x(function(d) {
    return x(d.date);
  })
  .y0(height)
  .y1(function(d) {
    return y(d.price);
  });

var area2 = d3.area()
  .curve(d3.curveMonotoneX)
  .x(function(d) {
    return x2(d.date);
  })
  .y0(height2)
  .y1(function(d) {
    return y2(d.price);
  });

svg.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height);

var focus = svg.append("g")
  .attr("class", "focus")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
  .attr("class", "context")
  .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

var key = d3.select(".key");
console.log(key);

var items = key.selectAll("item")
              .data(inference_types)
              .enter()
              .append("div")
              .attr("class", "item");

items.append("div")
    .attr("class", "indicator")
    .style("background-color", function(d, i) {
      return d[2];
    });

items.append("p")
    .attr("class", "name")
    .text(function(d) {
      return d[1];
    });

key.append("div")
  .attr("class", "indicator");

var lengthPerSecond;

d3.csv("./data/s1.csv", type).then(function(data) {
  // if (error) throw error;

  x.domain([parseTime("0:0:0"), d3.max(data, function(d) {
    return d.timeEnd;
  })])
  y.domain([-100, 100]);
  x2.domain(x.domain());
  y2.domain(y.domain());

	var minTime = parseTime("0:0:0")
	var maxTime = d3.max(data, function(d) {
		return d.timeEnd
	});

	var maxSeconds = (maxTime.getTime() - minTime.getTime()) / 1000;
	lengthPerSecond = (maxSeconds / width);

  focus.selectAll("line")
    .data(data)
    .enter()
		.append("line")
		.attr("class", "bubble")
		.attr('x1', function(d, i) {
			return x(d.timeStart);
		})
		.attr('x2', function(d, i) {
			return x(d.timeEnd);
		})
		// .attr('width', function(d) {
		// 	return (d.nWords * lengthPerSecond * 3);
		// })
		.attr("stroke", function(d) {
			return colours[d.code];
		})

  focus.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  focus.append("g")
  // .attr("class", "axis axis--y")
  // .call(yAxis);

  context.selectAll("line")
    .data(data)
    .enter()
    .append("line")
    .attr("class", "line")
    .attr("x1", function(d, i) {
      return x(d.timeStart);
    })
    .attr("x2", function(d, i) {
      return x(d.timeStart);
    })
    .attr("y1", 0)
    .attr("y2", height2)
    .attr("stroke", function(d) {
      return colours[d.code];
    })
    .attr("stroke-width", 2);

  context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height2 + ")")
    .call(xAxis2);

  context.append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, x.range());

  svg.append("rect")
    .attr("class", "zoom")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);
});

function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  var s = d3.event.selection || x2.range();
  x.domain(s.map(x2.invert, x2));
  focus.selectAll(".bubble")
    .attr("x1", function(d, i) {
      return x(d.timeStart);
    })
		.attr('x2', function(d, i) {
			return x(d.timeEnd);
		})
    // .attr("x2", function(d, i) {
    //   return x(d.timestamp);
    // });
  focus.select(".axis--x").call(xAxis);
  svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
    .scale(width / (s[1] - s[0]))
    .translate(-s[0], 0));
}

function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
  var t = d3.event.transform;
  x.domain(t.rescaleX(x2).domain());
  focus.selectAll(".bubble")
    .attr("x1", function(d, i) {
      return x(d.timeStart);
    })
		.attr('x2', function(d, i) {
			return x(d.timeEnd);
		})
  focus.select(".axis--x").call(xAxis);
  context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}

function type(d) {

  return {
    d: parseTime(d.d),
    t: parseInt(d.ts),
    type: d.type,
    typeval: parseInt(d.typeval)
  };
}

var colours = ["silver", "gray", "red", "orange", "yellow", "green", "brown", "blue", "purple", "gray", "black", "pink", "olive", "teal", "hsl(0, 0%, 86%)"];

function bubbleLength() {

}

// Function to process the data
function type(d) {
  return {
    index: d.index,
    timeStart: parseTime(d.timestamp),
		timeEnd: timeEnd(parseTime(d.timestamp), numberWords(determineUtterance([d.links, d.rechts])[1])),
    utterance: determineUtterance([d.links, d.rechts])[1],
		source: determineUtterance([d.links, d.rechts])[0],
		nWords: numberWords(determineUtterance([d.links, d.rechts])[1]),
		code: fakeCode()
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
	const wordLength = 6;
	return Math.round((utterance.length/wordLength));
}

var timeEnd = function(t, w) {
	var newD = new Date(t.getTime() + (w / 4) * 1000);
	return newD;
}

var fakeCode = function() {
	var i = Math.floor(Math.random() * 100);
	if (i > 70) {
		return Math.floor(Math.random() * 13);
	}
	return 14;
}

var parseTime = d3.timeParse("%H:%M:%S");
