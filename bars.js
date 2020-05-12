function barchart(data) {
  // width =
  // height =
  const svg = d3.select("body").select("svg#bars") //getting the svg
                .attr("transform", translate(550, -500));

  barHeight = 25

  margin = ({
    top: 30,
    right: 60,
    bottom: 10,
    left: 60
  })
  height = 600 //Math.ceil((data.length + 0.1) * barHeight) + margin.top + margin.bottom
  width = 560


  data.forEach(function(d) {
    d.subcat = d["Incident Subcategory"];
    d.year = d["Incident Year"];
  });

  let year2019 = data.filter(function(d) {
    return d.year == "2019";
  });

  let year2020 = data.filter(function(d) {
    return d.year == "2020";
  });

  let merged2019 = Object.values(year2019.reduce((r, o) => {
    r[o.subcat] = r[o.subcat] || {
      subcat: o.subcat,
      count: 0
    };
    r[o.subcat].count += 1;
    return r;
  }, {}));

  let merged2020 = Object.values(year2020.reduce((r, o) => {
    r[o.subcat] = r[o.subcat] || {
      subcat: o.subcat,
      count: 0
    };
    r[o.subcat].count += 1;
    return r;
  }, {}));

  let min = 10000;
  let max = 0;

  merged2020.forEach(function(d) {
    let this_Year = 0;
    merged2019.forEach(function(k) {
      if (k.subcat == d.subcat) {
        this_Year = k.count;
      }
    });

    let new_count = getPercentageChange(d.count, this_Year);
    d.count = new_count;

    if (new_count < min) {
      min = new_count;
    }
    if (new_count > max) {
      max = new_count;
    }
  });

  // data = d3.csvParse(await FileAttachment("state-population-2010-2019.tsv").text(),
  //  ({State: name, "2010": value0, "2019": value1}) => ({name, value: metric === "absolute" ? value1 - value0 : (value1 - value0) / value0})).sort((a, b) => d3.ascending(a.value, b.value))

  let x = d3.scaleLinear()
    .range([20, width - 100])
    .domain([-250, 100]);

  svg.append("g")
    .attr("transform", translate(0, height - 100))
    .call(d3.axisBottom(x))

  let subcats = d3.map(merged2020, function(d) {
    return d.subcat;
  }).keys()


  let y = d3.scaleBand()
    .range([height - 50, 0])
    .domain(subcats)
    .paddingInner(0.05)

  svg.append('g')
    .attr("transform", translate(335, -50))
    .call(d3.axisLeft(y))
    .attr('id', 'y-axis')
    .selectAll("text").attr("id", "y-text");


  let selected = false;

  svg.append("g")
    .selectAll("rect")
    .data(merged2020)
    .join("rect")
    .attr("x", d => x(Math.min(d.count, 0))+1)
    .attr("y", d => y(d.subcat) - 23)
    .attr("width", d => Math.abs(x(d.count) - x(0)))
    .attr("height", 15)
    .style("fill", "#006E6A")
    .style("stroke", "black")
    .attr("transform", translate(0, 0))
    .on("click", function (d){
        mapFilter(d.subcat);
    });

  function translate(x, y) {
    return 'translate(' + x + ',' + y + ')';
  }

  function getPercentageChange(oldNumber, newNumber) {
    var decreaseValue = oldNumber - newNumber;
    return (decreaseValue / oldNumber) * 100;
  }


}
