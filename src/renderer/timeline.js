'use strict'

var d3 = require("d3");

var $greyLighter = d3.rgb("#E2E2E9")
var $blue = d3.rgb("#23B2FE");
var $yellow = d3.rgb("#FEBC2D");



var coding_scheme = [
  [0, "none", "#f6f6f6", ""],
  [1, "deduction", "silver", ""],
  [2, "induction", "gray", ""],
  [3, "regressive1", "red", "frame", "problem"],
  [4, "regressive2", "orange", "frame", "solution"],
  [5, "transformation1", "yellow", "frame", "problem"],
  [6, "transformation2", "green", "frame", "solution"],
  [7, "proposition1", "brown", "frame", "problem"],
  [8, "proposition2", "blue", "relation", "solution"],
  [9, "composition1", "purple", "relation", "problem"],
  [10, "composition2", "black", "relation", "solution"],
  [11, "prioritisation1", "pink", "relation", "problem"],
  [12, "prioritisation2", "olive", "relation", "solution"],
  [13, "decomposition1", "teal", "element", "problem"],
  [14, "decomposition2", "maroon", "element", "solution"],
  [15, "manipulation1", "teal", "element", "problem"],
  [16, "manipulation2", "maroon", "element", "solution"]
];

var svg = d3.select("svg"),
  margin = {
    top: 20,
    right: 20,
    bottom: 110,
    left: 40
  },
  margin2 = {
    top: 625,
    right: 20,
    bottom: 30,
    left: 40
  },
  width = svg.node().getBoundingClientRect().width - margin.left - margin.right,
  height = svg.node().getBoundingClientRect().height - margin.top - margin.bottom,
  height2 = svg.node().getBoundingClientRect().height - margin2.top - margin2.bottom;

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
    .data(coding_scheme)
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
              .data(coding_scheme)
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


var bubbleWidth = function(d) {
  var tStart = d.timeStart;
  var tEnd = new Date(tStart.getTime() + 5000);
  //return (x(tEnd) - x(tStart));
  return 10;
}

Promise.all([
    d3.csv("./data/s1.csv", type),
    d3.csv("./data/s6.csv", type),
    d3.csv("./data/s8.csv", type),
]).then(function(files) {
    // files[0] will contain file1.csv
    // files[1] will contain file2.csv

    // Store maximum values
    var endTimes = [];

    var tooltip = d3.select(".wrapper")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("z-index", "100")


    // var participant = d3.select(".tooltip")

      // .style("background-color", "red")

    // console.log(participant)

    var mouseover = function(d) {
      console.log("mouseover");
      tooltip
        .style("opacity", 1)
        .style("z-index", 100)
      d3.select(this)
        // .style("stroke", "black")
        .style("opacity", 1)
    }
    var mousemove = function(d) {
      console.log("mousemove");
      console.log(d3.event.pageX, d3.event.pageY)
      tooltip
        .html("<div class='participant' style='background-color:" + d.nameColor + "'><p>" + d.name + "</p></div><p><span>Code</span><br>" + coding_scheme[d.code][1] + "<br><span>Time<br></span>" + d.timeStart.toString().split(" ")[4] + " - " + d.timeEnd.toString().split(" ")[4] + "<br><span>episode</span><br>" + d.utterance + "</p>")
        .style("left", function() {
          var x = d3.event.pageX;
          var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
          if (x > (w - tooltip.node().getBoundingClientRect().width)) {
            return (x - tooltip.node().getBoundingClientRect().width - 10) + "px"
          }
          return (x + 10) + "px";
        })
        .style("top", function() {
          var y = d3.event.pageY;
          var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
          if (y > (h - tooltip.node().getBoundingClientRect().height)) {
            return (y - tooltip.node().getBoundingClientRect().height - 10) + "px"
          }
          return (y + 10) + "px";
        })
    }
    var mouseleave = function(d) {
      console.log("mouseleave")
      tooltip
        .style("opacity", 0)
        .style("z-index", -1)
      d3.select(this)
        // .style("stroke", "none")
        // .style("opacity", 0.8)
    }

    for(let i = 0; i < files.length; i++) {
      var data = files[i];
      var minTime = parseTime("0:0:0")
      var maxTime = d3.max(data, function(d) {
        return d.timeEnd;
      })
      endTimes.push(maxTime)
      x.domain([parseTime("0:0:0"), d3.max(endTimes)])
      y.domain([-100, 100]);
      x2.domain(x.domain());
      y2.domain(y.domain());

      for(var j = 0; j < data.length; j++) { data[j].next = data[j+1]; }

      var timeline = focus.append("g")
        .attr("class", "timeline")
        .attr("transform", "translate(0, " + i * 80 + ")")

      timeline.append("line")
        .attr("class", "axis")
        .attr("x1", 0)
        .attr("x2", x(maxTime))
        .attr("y1", 30)
        .attr("y2", 30)
        .attr("stroke", "black")
        .attr("stroke-width", 0.1)

      timeline.selectAll("rect")
        .data(data)
        .enter()
    		.append("rect")
    		.attr("class", "bubble")
    		.attr('x', function(d, i) {
          return x(d.timeStart);
        })
    		.attr('width', function(d) {
          return bubbleWidth(d);
    		})
        .attr('height', function (d) {
          if (coding_scheme[d.code][3] === "frame") {
            return 40
          } else if (coding_scheme[d.code][3] === "relation") {
            return 30
          } else if (coding_scheme[d.code][3] === "element") {
            return 20
          }
          return 10
        })
        .attr('y', function(d) {
          if (coding_scheme[d.code][4] === "problem") {
            if (coding_scheme[d.code][3] === "frame") {
              return (- 40 + 35)
            } else if (coding_scheme[d.code][3] === "relation") {
              return (- 30 + 35)
            } else if (coding_scheme[d.code][3] === "element") {
              return (- 20 + 35)
            }
          }
          return 25;
        })
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', function(d, i) {
          //return "url(#gradient-" + coding_scheme[d.code][2] + ")"
          if (coding_scheme[d.code][4] === "problem") {
            return $yellow;
          } else if (coding_scheme[d.code][4] === "solution") {
            return $blue
          }
          return $greyLighter;
        })
        .attr('fill-opacity', 0.6)
        .attr('stroke', function(d) {
          if (coding_scheme[d.code][4] === "problem") {
            return $yellow;
          } else if (coding_scheme[d.code][4] === "solution") {
            return $blue
          }
          return $greyLighter;
        })
        .attr("stroke-width", "1px")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

        var cTimeline = context.append("g")
          .attr("class", "cTimeline")
          .attr("transform", "translate(0, " + i * 15 + ")")

        cTimeline.selectAll("line")
          .data(data)
          .enter()
          .append("line")
          .attr("class", "line")
          .attr("x1", function(d) {
            return x(d.timeStart);
          })
          .attr("x2", function(d) {
            return x(d.timeStart);
          })
          .attr("y1", 0)
          .attr("y2", 10)
          .attr("stroke", function(d) {
            if (coding_scheme[d.code][4] === "problem") {
              return $yellow;
            } else if (coding_scheme[d.code][4] === "solution") {
              return $blue
            }
            return $greyLighter;
          })
          .attr("stroke-width", "1px")
    }
    focus.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    context.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

    context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range()); // Set initial brush size

    x.domain([parseTime("0:0:0"), d3.max(endTimes)])
    y.domain([-100, 100]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    console.log(d3.max(endTimes));
}).catch(function(err) {
    // handle error here
})

function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  var s = d3.event.selection || x2.range();
  x.domain(s.map(x2.invert, x2));
  focus.selectAll(".bubble")
    .attr("x", function(d, i) {
      return x(d.timeStart);
    })
		.attr('width', function(d, i) {
      return bubbleWidth(d);
		});
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
      return bubbleWidth(d);
    })
  focus.select(".axis--x").call(xAxis);
  context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}

// PARSE THE DATA INTO THE RIGHT FORMAT FOR THE DATA VISUALISATIONS

// Function to process the data
function type(d) {
  return {
    index: d.index,
    timeStart: parseTime(d.timestamp),
		timeEnd: timeEnd(parseTime(d.timestamp), numberWords(determineUtterance([d.links, d.rechts])[1])),
    utterance: determineUtterance([d.links, d.rechts])[1],
		source: determineUtterance([d.links, d.rechts])[0],
		nWords: numberWords(determineUtterance([d.links, d.rechts])[1]),
		code: determineCode(d.code),
    name: firstLetterName(d.firstlettername),
    nameColor: colorForName(firstLetterName(d.firstlettername), d.age, determineUtterance([d.links, d.rechts])[0])
  };
}

// Strips the dot after the participant's name first letter
var firstLetterName = function(n) {
  if (n.endsWith('.')) {
    n = n.split('.')[0];
  }
  return n.toUpperCase();
}

// Returns the right index number for the code based on the defined coding scheme
var determineCode = function(c) {
  if (c.length > 0) {
    for (var code of coding_scheme) {
      if (code[1] === c) {
        return code[0]
      }
    }
  }
  return "0";
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

var parseTime = d3.timeParse("%H:%M:%S");

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

var colorForName = function(text, age, position) {
  var hue = Math.random() * 255;
  var alphabet = "abcdefghijklmnopqrstuvwxyz".split('');
  var alphabetPosition = text.toLowerCase().split('').map(x => alphabet.indexOf(x) + 1);
  alphabetPosition[0]

  // TODO: determine the letter of the alphabet + add use other static factors to determineCode
  // the hue of the participant circle. E.g. Left/Right, male/female, last digit of the age?
  // hue is between 0-360
  // letter position: 1-26
  // last digit age: 0-9
  //
  var hue = (alphabetPosition[0] * (age % 10)) / position
  hue = hue.map(0, 234, 0, 360)
  // console.log(letter.charCodeAt(0));

  return "hsl(" + hue + ", 80%, 60%)";

}
