'use strict'

var d3 = require("d3");

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

var lengthPerSecond;

var bubbleWidth = function(d, i) {
  // prevEnd = d.timeEnd;
  var w = x(d.timeEnd) - x(d.timeStart);
  if (d.next && x(d.next.timeStart) <= x(d.timeEnd)) {
    w = x(d.next.timeStart) - x(d.timeStart);
  }
  return (w < bubbleHeight) ? bubbleHeight : w;
}

d3.csv("./data/s8.csv", type).then(function(data) {
  // if (error) throw error;
  for(var i = 0; i < data.length; i++) { data[i].next = data[i+1]; }
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
    .style("border", "solid")
    .style("border-width", "2px")
    .style("z-index", "100")

  // Three function that change the tooltip when user hover / move / leave a cell
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
    console.log(d);
    tooltip
      .html("<div class='participant'><p>" + d.name + "</p></div><p><span>Code</span><br>" + coding_scheme[d.code][1] + "<br><span>Time<br></span>" + d.timeStart.toString().split(" ")[4] + " - " + d.timeEnd.toString().split(" ")[4] + "<br><span>episode</span><br>" + d.utterance + "</p>")
      .style("left", (d3.mouse(this)[0]+350) + "px")
      .style("top", (d3.mouse(this)[1]+60) + "px")
  }
  var mouseleave = function(d) {
    tooltip
      .style("opacity", 0)
      .style("z-index", -1)
    d3.select(this)
      // .style("stroke", "none")
      // .style("opacity", 0.8)
  }



	var maxSeconds = (maxTime.getTime() - minTime.getTime()) / 1000;
	lengthPerSecond = (maxSeconds / width);

  focus.append("line")
    .attr("x1", 0)
    .attr("x2", x(maxTime))
    .attr("y1", 20)
    .attr("y2", 20)
    .attr("stroke", "black")
    .attr("stroke-width", 0.1)

  focus.selectAll("rect")
    .data(data)
    .enter()
		.append("rect")
		.attr("class", "bubble")
		.attr('x', function(d, i) {
      return x(d.timeStart);
    })
		.attr('width', function(d, i) {
      return 10;
      //return bubbleWidth(d, i);
		})
    .attr('height', function (d) {
      if (coding_scheme[d.code][3] === "frame") {
        return 60
      } else if (coding_scheme[d.code][3] === "relation") {
        return 40
      } else if (coding_scheme[d.code][3] === "element") {
        return 20
      }
      return 10
    })
    .attr('y', function(d) {
      if (coding_scheme[d.code][4] === "problem") {
        if (coding_scheme[d.code][3] === "frame") {
          return (- 60 + 20)
        } else if (coding_scheme[d.code][3] === "relation") {
          return (- 40 + 20)
        } else if (coding_scheme[d.code][3] === "element") {
          return (- 20 + 20)
        }
      }
      return 10;
    })
    .attr('rx', 5)
    .attr('ry', 5)
    .attr('fill', function(d, i) {
      //return "url(#gradient-" + coding_scheme[d.code][2] + ")"
      if (coding_scheme[d.code][4] === "problem") {
        return "yellow";
      } else if (coding_scheme[d.code][4] === "solution") {
        return "blue"
      }
      return "silver";
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)




  focus.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

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
      //return coding_scheme[d.code][2];
      console.log(d.code[4]);
      if (d.code[4] === "problem") {
        return "yellow";
      } else if (d.code[4] === "solution") {
        return "blue"
      }
      return "silver";
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
			//return bubbleWidth(d, i);
      return 10;
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
      //return bubbleWidth(d, i);
      return 10;
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
		code: determineCode(d.code),
    name: firstLetterName(d.firstlettername)
  };
}

var firstLetterName = function(n) {
  if (n.endsWith('.')) {
    n = n.split('.')[0];
  }
  return n.toUpperCase();
}

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
