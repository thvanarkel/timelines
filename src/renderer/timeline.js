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
	[14, "None", "silver"]
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

var bubbleHeight = 20;

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
  .attr("height", height)

var defs = svg.select("defs")

  var gradients = defs.selectAll("linearGradient")
    .data(inference_types)
    .enter()
    .append("linearGradient")
      .attr("id", function(d, i) {
        return "gradient-" + d[2];
      }  )
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%")

  gradients.append("stop")
    .attr("class", "stop1")
    .attr("offset", "0%")
    .attr("stop-color", "#f7f9ff");
  gradients.append("stop")
    .attr("class", "stop2")
    .attr("offset", "100%")
    .attr("stop-color", function(d, i) {
      return d[2];
    });

svg.append("rect")
  .attr("class", "zoom")
  .attr("width", width)
  .attr("height", height)
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  .call(zoom);

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

var bubbleWidth = function(d, i) {
  // prevEnd = d.timeEnd;
  var w = x(d.timeEnd) - x(d.timeStart);
  return (w < bubbleHeight) ? bubbleHeight : w;
}

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

  var tooltip = d3.select(".wrapper")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("z-index", "100")

  // Three function that change the tooltip when user hover / move / leave a cell
  var mouseover = function(d) {
    console.log("mouseover");
    tooltip
      .style("opacity", 1)
    d3.select(this)
      // .style("stroke", "black")
      .style("opacity", 1)
  }
  var mousemove = function(d) {
    console.log(d);
    tooltip
      .html("Start: " + d.timeStart + " End: " + d.timeEnd + "<br>this cell is: " + d.utterance)
      .style("left", (d3.mouse(this)[0]) + "px")
      .style("top", (d3.mouse(this)[1]+80) + "px")
  }
  var mouseleave = function(d) {
    tooltip
      .style("opacity", 0)
    d3.select(this)
      // .style("stroke", "none")
      // .style("opacity", 0.8)
  }



	var maxSeconds = (maxTime.getTime() - minTime.getTime()) / 1000;
	lengthPerSecond = (maxSeconds / width);

  var prevEnd = parseTime("00:00:00");

  focus.selectAll("rect")
    .data(data)
    .enter()
		.append("rect")
		.attr("class", "bubble")
		.attr('x', function(d, i) {
      if (x(d.timeStart) > x(prevEnd)) {
			   return x(prevEnd);
		  }
      return d.timeStart;
    })
		.attr('width', function(d, i) {
      return bubbleWidth(d, i);
		})
    .attr('height', bubbleHeight)
    .attr('y', function(d) {
      return 10;
    })
    .attr('fill', function(d, i) {
      return "url(#gradient-" + inference_types[d.code][2] + ")"
      // return "url(#gradient-blue)";
    })
		// .attr('width', function(d) {
		// 	return (d.nWords * lengthPerSecond * 3);
		// })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)

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
      return inference_types[d.code][2];
    })
    .attr("stroke-width", 4)

  context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height2 + ")")
    .call(xAxis2);

  context.append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, x.range()); // Set initial brush size




});

function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  var s = d3.event.selection || x2.range();
  x.domain(s.map(x2.invert, x2));
  focus.selectAll(".bubble")
    .attr("x", function(d, i) {
      return x(d.timeStart);
    })
		.attr('width', function(d, i) {
			return bubbleWidth(d, i);
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
    .attr("x", function(d, i) {
      return x(d.timeStart);
    })
    .attr('width', function(d, i) {
      return bubbleWidth(d, i);
    })
  focus.select(".axis--x").call(xAxis);
  context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
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
