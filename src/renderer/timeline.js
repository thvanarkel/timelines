'use strict'

var d3 = require("d3");
var d3array = require("d3-array");
var fs = require("fs");
const { dialog } = require('electron').remote

// TODO: complete the colour list here
var $greyLighter = d3.rgb("#E2E2E9")
var $blue = d3.rgb("#0b4eb3"); //#23B2FE
var $yellow = d3.rgb("#f9a800"); // #FEBC2D

// var fileNames = ["s7"];
// Coding coding scheme
// [index, code, code-name, inference-type, inference-subtype, space]

var coding_scheme = [
  [0, "none", "none", "none", "none", "none"],
  [1, "deduction", "deduction", "deduction", "", ""],
  [2, "induction", "induction", "induction", "", ""],
  [3, "regression1", "regression", "abduction", "frame", "problem"],
  [4, "regression2", "regression", "abduction", "frame", "solution"],
  [5, "transformation1", "transformation", "abduction", "frame", "problem"],
  [6, "transformation2", "transformation", "abduction", "frame", "solution"],
  [7, "proposition1", "proposition", "abduction", "frame", "problem"],
  [8, "proposition2", "proposition", "abduction", "relation", "solution"],
  [9, "composition1", "composition", "abduction", "relation", "problem"],
  [10, "composition2", "composition", "abduction", "relation", "solution"],
  [11, "prioritization1", "prioritization", "abduction", "relation", "problem"],
  [12, "prioritization2", "prioritization", "abduction", "relation", "solution"],
  [13, "decomposition1", "decomposition", "abduction", "element", "problem"],
  [14, "decomposition2", "decomposition", "abduction", "element", "solution"],
  [15, "manipulation1", "manipulation", "abduction", "element", "problem"],
  [16, "manipulation2", "manipulation", "abduction", "element", "solution"]
];

// function createTooltips() {
//   if (!SVGElement.prototype.contains) {
//     SVGElement.prototype.contains = HTMLDivElement.prototype.contains;
//   }
//
//   console.log(document.querySelectorAll('.bar'))
//   tippy(document.querySelectorAll('.bar'));
// }

Array.from(document.querySelectorAll(".code-indicator")).forEach(
    function(element, index, array) {
        element.addEventListener('click', function (event) {
          var el = event.srcElement
          var c = el.classList
          c.toggle('deselected');
          var o = c.contains('deselected') ? "none" : "inline"
          var l = el.parentElement.getAttribute("filter-level")
          if (l === "inference-type") {
            d3.selectAll('.bubble')
              .each(function(d) {
                if (d.code[3] === el.parentElement.getAttribute("code")) {
                  d3.select(this)
                  .attr("display", o)
                }
              })
          } else if (l === "inference-subtype") {
            d3.selectAll('.bubble')
              .each(function(d) {
                if ((d.code[1]).includes(el.parentElement.getAttribute("code"))) {
                  d3.select(this)
                  .attr("display", o)
                }
              })
          }
        });
    }
);

class Timeline {
  margin = { top: 0, right: 5, bottom: 0, left: 5 }
  #height = 100;
  #width = d3.select('.timeline-view').node().getBoundingClientRect().width - this.margin.left - this.margin.right;
  animationDuration = 200
  stats = {}

  constructor(opts) {
    this.filename = opts.filename;
    this.container = opts.container;
  }

  static parseTime = d3.timeParse("%H:%M:%S");
  static formatTime = d3.timeFormat("%H:%M:%S");

  scales = {
        time: d3.scaleTime(),
        linear: d3.scaleLinear()
    }

  init() {
    d3.csv("./data/" + this.filename + ".csv", type).then((function(data) {

      this.container = d3.select(this.container)
                         .append("div")
                         .attr("class", "timeline")

      this.svg = this.container.append("svg")
                          .attr("height", this.#height - this.margin.top - this.margin.bottom)
                          .attr("width", this.#width - this.margin.left - this.margin.right)
                          .style("position", "relative")
                          .style("margin-left", this.margin.left)
                          .style("margin-top", this.margin.top)
      timeline = this.svg.append("g")
                          .attr("transform", "translate(40 0)")

      this.controls = this.container.append("div")
                    .attr("class", "controls")
                    .html('<span class="info"><i class="material-icons">info</i></span><span class="timescale" value="linear"><i class="material-icons">timer</i></span><span class="export"><i class="material-icons">open_in_new</i></span>')//<input type=\"radio\" name=\"x-scale\" value=\"linear\">Linear</label>\n<label><input type=\"radio\" name=\"x-scale\" value=\"time\" checked>Time</label><button type=\'button\'>Export</button>')

      this.calculateStats(data)
      console.log(this.stats)

      var constructVariableString = function(name, level, values, total) {
        return str = '<li class="l' + level + '">' + name + '<span class="value">' + ((values['problem'] || 0) + (values['solution'] || 0)) + '<i class="space">' + '(' + (values['problem'] || 0) + "/" + (values['solution'] || 0) + ')' + '</i>' + '<span class="total">' + "/"  + total + '</span></span></li>'
      }
      console.log(this.stats['levels'])
      var str = '<div><li class="l1" id="heading">name<span class="value">number<i = "space">(problem/solution)</i><span class="total">/total</span>'
      str += constructVariableString("abduction", 1, this.stats, this.stats['total']);
      for (var l in this.stats['levels']) {
        if (l !== "none") {
          str += constructVariableString(l, 2, this.stats['levels'][l], this.stats['total'] - this.stats['none']);
          for (var t in this.stats['levels'][l]['codes']) {
            str += constructVariableString(t, 3, this.stats['levels'][l]['codes'][t], (this.stats['levels'][l]['problem'] || 0) + (this.stats['levels'][l]['solution'] || 0));
          }
        }
      }
      str += '</div>'


      console.log(str);

      tippy(this.controls.select('.info').node(), {
        theme: "stats",
        delay: [200, 200],
        content: str
      });
      this.endTime = d3.max(data, function(d) {
        return d.timeEnd;
      })
      this.nBars = data.length

      var baseline = 0.5 * this.#height;

      var scaleX = this.xScale

      this.bars = timeline.selectAll("line")
              .data(data)
              .enter()
              .append("line")
              .attr("class", "bar")
              .attr('x1', (function(d, i) {
                return this.XPosition(d, i)
              }).bind(this))
              .attr('x2', (function(d, i) {
                return this.XPosition(d, i)
              }).bind(this))
              .attr('y1', (function(d) {
                if (d.code[1] === "none") {
                  return baseline - 3;
                }
                return baseline;
              }).bind(this))
              .attr('y2', function(d) {
                var displacement = 3;
                var stepsize = 7;
                if (d.code[4] === "frame") {
                  displacement = 3 * stepsize;
                } else if (d.code[4] === "relation") {
                  displacement = 2 * stepsize;
                } else if (d.code[4] === "element") {
                  displacement = stepsize;
                }

                if (d.code[5] === "problem") {
                  return baseline - displacement;
                }
                return baseline + displacement
              })
              .attr('stroke', function(d) {
                if (d.code[5] === "problem") {
                  return $yellow;
                } else if (d.code[5] === "solution") {
                  return $blue
                }
                return $greyLighter;
              })
              .attr("stroke-width", "1px")
              // .on("mouseover", mouseover)
              // .on("mousemove", mousemove)
              // .on("mouseleave", mouseleave)

      var labels = ["FR", "RE", "EL", "", "EL", "RE", "FR"];

      var l = this.svg.append("g");

      l.append("text")
        .text(this.filename)
        .attr('x', 0)
        .attr('y', 55)
        .attr("font-size", "10px")

      for (var i = 0; i < labels.length; i++) {
        var a = i < 3 ? 5 : 0
        l.append("text")
          .text(labels[i])
          .attr('x', 20)
          .attr('y', 29 + (i * 7) + a)
          .attr("font-size", "7px")
        l.append("line")
          .attr('x1', 20)
          .attr('x2', this.#width)
          .attr('y1', 29 + (i * 7))
          .attr('y2', 29 + (i * 7))
          .attr("stroke", "black")
          .attr("stroke-width", 0.1)
      }
      l.append("line")
        .attr('x1', 35)
        .attr('x2', 35)
        .attr('y1', 29)
        .attr('y2', 29 + ((labels.length - 1) * 7))
        .attr("stroke", "black")
        .attr("stroke-width", 1)

      this.setXScale();
      this.xScale.range([0, this.#width - 40]);

      this.xAxis = d3.axisBottom()
          .scale(this.xScale);

      this.domXAxis = this.svg.append("g")
          .attr("class", "axis axis--x")
          // .attr("transform", "translate(0," + this.#height + ")")
          .call(this.xAxis);

      this.adjustScale()
      this.redraw()

      this.controls.selectAll(".export").on("click", this.export.bind(this));
      this.controls.selectAll(".timescale").on("click", this.changeXScale.bind(this))
    }).bind(this));
  }

  calculateStats(d) {
    console.log(d);
    var values = d3array.rollups(d, v => v.length, d => d.code[4], d => d.code[2], d => d.code[5])
    values = Array.from(values, ([key, value]) => ({key, value}));
    var pc = 0, sc = 0, count = 0;

    var l = {}
    for (var ty of values) { // iterate over inference_sub_types
      var st = {}
      st.codes = {}
      var tt = 0
      for (var c of ty.value) { // iterate over codes
        var e = {}
        var t = 0
        for (var s of c[1]) { // iterate over space
          this.stats['total'] = (this.stats['total'] || 0) + s[1];
          this.stats[s[0]] = (this.stats[s[0]] || 0) + s[1];
          e[s[0]] = (e[s[0]] || 0) + s[1]
          st[s[0]] = (st[s[0]] || 0) + s[1]
          t += s[1]
        }
        e['total'] = t
        st['codes'][c[0]] = e;
        tt += t
      }
      st['total'] = tt
      l[ty.key] = st;
    }
    this.stats['levels'] = l;

  }

  redraw() {
    this.domXAxis.transition()
        .duration(this.animationDuration)
        .call(this.xAxis.scale(this.xScale));
    this.bars.transition()
      .duration(this.animationDuration)
      .attr("x1", (function(d, i) {
        return this.XPosition(d, i)
      }).bind(this))
      .attr("x2", (function(d, i) {
        return this.XPosition(d, i)
      }).bind(this))
  }

  changeXScale() {
    this.setXScale();
    this.adjustScale();
    this.redraw();
  }

  setXScale() {
    var control = this.controls.select(".timescale")
    var v = control.attr("value") === "time" ? "linear" : "time"
    control.attr("value", v)
    this.scaleType = v;
    if (this.scaleType === "time") {
      control.select("i").html("timer")
    } else if (this.scaleType === "linear") {
      control.select("i").html("timer_off")
    }
    this.xScale = this.scales[this.scaleType];
    this.xScale.range([0, this.#width - 40]);
  }

  adjustScale() {
    if (this.scaleType === "time") {
      this.xAxis.tickFormat(formatTime)
      this.xScale.domain([parseTime("0:0:0"), this.endTime]);
    } else if (this.scaleType === "linear") {
      this.xAxis.tickFormat(d3.format("0"))
      this.xScale.domain([0, this.nBars])
    }
  }

  XPosition(d, i) {
    if (this.scaleType === "time") {
      return this.xScale(d.timeEnd)
    } else if (this.scaleType === "linear") {
      return this.xScale(i)
    }
  }

  export() {
    var svgString = getSVGString(this.svg.node());
    var path = dialog.showOpenDialogSync({ properties: ['openDirectory'] })
    path += "/timeline-" + this.filename + ".svg"
    fs.writeFile(path, svgString, (err) => {
      // throws an error, you could also catch it here
    if (err) throw err;
      // success case, the file was saved
      console.log('Saved visual!');
    });
  }
}

var parseTime = d3.timeParse("%H:%M:%S");

var fileNames = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "s1", "s4", "s5", "s6", "s7", "s8"]

for (var i = 1; i < fileNames.length; i++) {
  var timeline = new Timeline({
    filename: fileNames[i],
    container: ".timeline-view"
  })
  timeline.init()
}

// D3 visualisation
var svg = d3.select("svg"),
  margin = {
    top: 20,
    right: 20,
    bottom: 110,
    left: 40
  },
  margin2 = {
    top: svg.node().getBoundingClientRect().height - ((fileNames.length * 15) + 40),
    right: 20,
    bottom: 30,
    left: 40
  },
  width = 80,//svg.node().getBoundingClientRect().width - margin.left - margin.right,
  height = 1500,//svg.node().getBoundingClientRect().height - margin.top - margin.bottom,
  height2 = (fileNames.length * 15) //svg.node().getBoundingClientRect().height - margin2.top - margin2.bottom;

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

svg.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height)

svg.append("rect")
  .attr("class", "zoom")
  .attr("width", width)
  .attr("height", height)
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  .call(zoom);

var focus = svg.append("g")
  .attr("class", "focus")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// var context = svg.append("g")
//   .attr("class", "context")
//   .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

var bubbleWidth = function(d) {
  var tStart = d.timeStart;
  var tEnd = new Date(tStart.getTime() + 5000);
  return 2;
}

var promises = [];

for (var i = 0; i < fileNames.length; i++) {
  promises.push(d3.csv("./data/" + fileNames[i] + ".csv", type));
}

Promise.all(promises).then(function(files) {
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

    var mouseover = function(d) {
      console.log("mouseover");
      tooltip
        .style("opacity", 1)
        .style("z-index", 100)
      d3.select(this)
        .style("opacity", 1)
    }
    var mousemove = function(d) {
      console.log("mousemove");
      console.log(d3.event.pageX, d3.event.pageY)
      tooltip
        .html("<div class='participant' style='background-color:" + d.nameColor + "'><p>" + d.name + "</p></div><p><span>Code</span><br>" + d.code[1] + "<br><span>Time<br></span>" + d.timeStart.toString().split(" ")[4] + " - " + d.timeEnd.toString().split(" ")[4] + "<br><span>episode</span><br>" + d.utterance + "</p>")
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
        .attr("session", fileNames[i])
        .attr("transform", "translate(0, " + i * 80 + ")")

      timeline.append("line")
        .attr("class", "axis")
        .attr("x1", 20)
        .attr("x2", width)
        .attr("y1", 30)
        .attr("y2", 30)
        .attr("stroke", "black")
        .attr("stroke-width", 0.1)

      timeline.append("text")
        .text( function(d) {
          return fileNames[i];
        })
        .attr('x', 0)
        .attr('y', 33)
        .attr("font-size", "10px")

        timeline.append("text")
          .text("p")
          .attr('x', 20)
          .attr('y', 25)
          .attr("font-size", "7px")

        timeline.append("text")
          .text("s")
          .attr('x', 20)
          .attr('y', 39)
          .attr("font-size", "7px")

      let baseline = 30

      timeline.selectAll("line")
        .data(data)
        .enter()
    		.append("line")
    		.attr("class", "bubble")
    		.attr('x1', function(d, i) {
          return x(d.timeStart);
        })
        .attr('x2', function(d, i) {
          return x(d.timeStart);
        })
        .attr('y2', function (d) {
          var displacement = 3;
          var stepsize = 7
          if (d.code[4] === "frame") {
            displacement = 3 * stepsize
          } else if (d.code[4] === "relation") {
            displacement = 2 * stepsize
          } else if (d.code[4] === "element") {
            displacement = stepsize
          }

          if (d.code[5] === "problem") {
            return baseline + displacement
          }
          return baseline - displacement
        })
        .attr('y1', function(d) {
          if (d.code[1] === "none") {
            return baseline + 3;
          }
          return baseline;
        })
        .attr('rx', 0)
        .attr('ry', 0)
        .attr('fill', function(d, i) {
          if (d.code[5] === "problem") {
            return $yellow;
          } else if (d.code[5] === "solution") {
            return $blue
          }
          return $greyLighter;
        })
        .attr('fill-opacity', 0.6)
        .attr('stroke', function(d) {
          if (d.code[5] === "problem") {
            return $yellow;
          } else if (d.code[5] === "solution") {
            return $blue
          }
          return $greyLighter;
        })
        .attr("stroke-width", "1px")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

        // var cTimeline = context.append("g")
        //   .attr("class", "cTimeline")
        //   .attr("transform", "translate(0, " + i * 15 + ")")
        //
        // cTimeline.selectAll("line")
        //   .data(data)
        //   .enter()
        //   .append("line")
        //   .attr("class", "line")
        //   .attr("x1", function(d) {
        //     return x(d.timeStart);
        //   })
        //   .attr("x2", function(d) {
        //     return x(d.timeStart);
        //   })
        //   .attr("y1", 0)
        //   .attr("y2", 10)
        //   .attr("stroke", function(d) {
        //     if (d.code[4] === "problem") {
        //       return $yellow;
        //     } else if (d.code[4] === "solution") {
        //       return $blue
        //     }
        //     return $greyLighter;
        //   })
        //   .attr("stroke-width", "1px")

    }
    focus.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // context.append("g")
    //   .attr("class", "axis axis--x")
    //   .attr("transform", "translate(0," + height2 + ")")
    //   .call(xAxis2);
    //
    // context.append("g")
    //   .attr("class", "brush")
    //   .call(brush)
    //   .call(brush.move, x.range()); // Set initial brush size
    //
    // context.attr("transform", "translate(" + margin.left + "," + margin2.top + ")");

    x.domain([parseTime("0:0:0"), d3.max(endTimes)])
    y.domain([-100, 100]);
    x2.domain(x.domain());
    y2.domain(y.domain());
}).catch(function(err) {
    // handle error here
})

function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  var s = d3.event.selection || x2.range();
  x.domain(s.map(x2.invert, x2));
    focus.selectAll(".bubble")
    .attr("x1", function(d, i) {
      return x(d.timeStart);
    })
    .attr("x2", function(d, i) {
      return x(d.timeStart);
    })
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
    .attr("x2", function(d, i) {
      return x(d.timeStart);
    })
  focus.select(".axis--x").call(xAxis);
  // context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
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
        return code
      }
    }
  }
  return coding_scheme[0];
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

// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
function getSVGString( svgNode ) {
	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
	var cssStyleText = getCSSStyles( svgNode );
	appendCSS( cssStyleText, svgNode );

	var serializer = new XMLSerializer();
	var svgString = serializer.serializeToString(svgNode);
	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

	return svgString;

	function getCSSStyles( parentElement ) {
		var selectorTextArr = [];

		// Add Parent element Id and Classes to the list
		selectorTextArr.push( '#'+parentElement.id );
		for (var c = 0; c < parentElement.classList.length; c++)
				if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
					selectorTextArr.push( '.'+parentElement.classList[c] );

		// Add Children element Ids and Classes to the list
		var nodes = parentElement.getElementsByTagName("*");
		for (var i = 0; i < nodes.length; i++) {
			var id = nodes[i].id;
			if ( !contains('#'+id, selectorTextArr) )
				selectorTextArr.push( '#'+id );

			var classes = nodes[i].classList;
			for (var c = 0; c < classes.length; c++)
				if ( !contains('.'+classes[c], selectorTextArr) )
					selectorTextArr.push( '.'+classes[c] );
		}

		// Extract CSS Rules
		var extractedCSSText = "";
		for (var i = 0; i < document.styleSheets.length; i++) {
			var s = document.styleSheets[i];

			try {
			    if(!s.cssRules) continue;
			} catch( e ) {
		    		if(e.name !== 'SecurityError') throw e; // for Firefox
		    		continue;
		    	}

			var cssRules = s.cssRules;
			for (var r = 0; r < cssRules.length; r++) {
				if ( contains( cssRules[r].selectorText, selectorTextArr ) )
					extractedCSSText += cssRules[r].cssText;
			}
		}


		return extractedCSSText;

		function contains(str,arr) {
			return arr.indexOf( str ) === -1 ? false : true;
		}

	}

	function appendCSS( cssText, element ) {
		var styleElement = document.createElement("style");
		styleElement.setAttribute("type","text/css");
		styleElement.innerHTML = cssText;
		var refNode = element.hasChildNodes() ? element.children[0] : null;
		element.insertBefore( styleElement, refNode );
	}
}
