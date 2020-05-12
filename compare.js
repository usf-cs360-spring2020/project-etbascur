function createMap() {
  const urls = {
    basemap: "https://data.sfgov.org/resource/6ia5-2f8k.geojson", //neighborhoods layout
    streets: "https://data.sfgov.org/resource/hn5x-7sr8.geojson?$limit=8000",
    //  police: "https://data.sfgov.org/resource/wg3w-h783.json",

  };

  const svg = d3.select("body").select("svg#vis")
                .attr("transform", translate(-250, 0));

  const g = {
    basemap: svg.select("g#basemap"),
    streets: svg.select("g#streets"),
    outline: svg.select("g#outline"),
    encamp: svg.select("g#police"),
    tooltip: svg.select("g#tooltip"),
    details: svg.select("g#details")
  };



  // setup tooltip (shows neighborhood name)
  const tip = g.tooltip.append("text").attr("id", "tooltip");
  tip.attr("text-anchor", "end");
  tip.attr("dx", -5);
  tip.attr("dy", -5);
  tip.style("visibility", "hidden");

  // add details widget
  // https://bl.ocks.org/mbostock/1424037
  const details = g.details.append("foreignObject")
    .attr("id", "details")
    .attr("width", 960)
    .attr("height", 600)
    .attr("x", 0)
    .attr("y", 0);

  const body = details.append("xhtml:body")
    .style("text-align", "left")
    .style("background", "none")
    .html("<p>N/A</p>");

  details.style("visibility", "hidden");

  // setup projection
  // https://github.com/d3/d3-geo#geoConicEqualArea
  const projection = d3.geoConicEqualArea();
  projection.parallels([37.692514, 37.840699]);
  projection.rotate([122, 0]);

  // setup path generator (note it is a GEO path, not a normal path)
  const path = d3.geoPath().projection(projection);

  d3.json(urls.basemap).then(function(json) {
    // makes sure to adjust projection to fit all of our regions
    projection.fitSize([960, 600], json);

    // draw the land and neighborhood outlines
    drawBasemap(json);

    // now that projection has been set trigger loading the other files
    // note that the actual order these files are loaded may differ
    //d3.json(urls.streets).then(drawStreets);
    d3.csv("policecorona.csv").then(drawpolice);
  });

  function drawBasemap(json) {
    console.log("basemap", json);

    const basemap = g.basemap.selectAll("path.land")
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", "land");

    const outline = g.outline.selectAll("path.neighborhood")
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", "neighborhood")
      .each(function(d) {
        // save selection in data for interactivity
        // saves search time finding the right outline later
        d.properties.outline = this
        d.properties.centroid = path.centroid(d);
      });


    // add highlight
    basemap.on("mouseover.highlight", function(d) {
        d3.select(d.properties.outline).raise();
        d3.select(d.properties.outline).classed("active", true);
      })
      .on("mouseout.highlight", function(d) {
        d3.select(d.properties.outline).classed("active", false);
      });

    // add tooltip
    basemap.on("mouseover.tooltip", function(d) {
        tip.text(d.properties.name); //HERE
        tip.style("visibility", "visible");
      })
      .on("mousemove.tooltip", function(d) {
        const coords = d3.mouse(g.basemap.node());
        tip.attr("x", coords[0]);
        tip.attr("y", coords[1]);
      })
      .on("mouseout.tooltip", function(d) {
        tip.style("visibility", "hidden");
      });
  }

  function drawStreets(json) {
    console.log("streets", json);


    // only show active streets
    const streets = json.features;

    // console.log("removed", json.features.length - streets.length, "inactive streets");

    g.streets.selectAll("path.street")
      .data(streets)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", "street");
  }

  function drawpolice(csv) {

    csv.forEach(function(d) {
      const latitude = parseFloat(d.Latitude);
      const longitude = parseFloat(d.Longitude);
      const pixels = projection([longitude, latitude]);

      d.x = pixels[0];
      d.y = pixels[1];
      d.type = d["Request Details"];
      d.subcat = d["Incident Subcategory"];
      d.year = d["Incident Year"];
      d.neighborhood = d["Analysis Neighborhood"];
    });

    //console.log(csv);
    let filtered = csv.filter(function(d) {
      return d.x > 0;
    })

    //console.log(filtered);

    // RADIUS OF CIRCLES //
    // let radius = d3.scaleSqrt()
    // .domain([0, 1e6])
    // .range([0, maxValue]);

    //COLORSCALE OF CIRCLES //
    //let myColor = d3.scaleSequential(d3.interpolatePuRd).domain([1,maxValue]);
    //let myColor = d3.scaleOrdinal(["#A2D4AB","#3EACA8","#5A5050"]);
    let myColor = d3.scaleOrdinal(["green", "purple"]);


    const symbols = g.encamp.selectAll("circle")
      .data(filtered)
      .enter()
      .append("circle")
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      })
      .attr("r", 4)
      .attr("fill", function(d) {
        return myColor(d.year)
      })
      .attr("class", "symbol")
      .style("visibility", "hidden");



    //tooltip
    symbols.on("mouseover.hover2", function(d) {
      let me = d3.select(this);
      let div = d3.select("body").append("div");

      div.attr("id", "details");
      div.attr("class", "tooltip");
      console.log("symbols", d);
      let array = ["", "﻿Analysis Neighborhood", "Incident Year", "Incident Subcategory"];

      let rows = div.append("table")
        .selectAll("tr")
        .data(array)
        .enter()
        .append("tr");

      rows.append("th").text(key => key);
      rows.append("td").text(key => d[key]);

      d3.select(this)
        .raise()
        .style("stroke", "blue")
        .style("stroke-width", 2);
    });

    symbols.on("mousemove.hover2", function(d) {
      let div = d3.select("div#details");
      let bbox = div.node().getBoundingClientRect();

      div.style("left", d3.event.pageX + "px");
      div.style("top", (d3.event.pageY - bbox.height) + "px");
    });

    symbols.on("mouseout.hover2", function(d) {
      d3.selectAll("div#details").remove();
      d3.select(this).style("stroke", null);
      //symbols.transition().style("fill", d => myColor(d.year));
    });


    //legend
    let col2data = csv.map(function(d) { return d.year });
    let ordinal = d3.scaleOrdinal()
      .domain(col2data)
      .range(["green","purple"]);

    svg.select("g#legend")
      .attr("class", "legendOrdinal")
      .attr("transform", "translate(100,170)");

    let legendOrdinal = d3.legendColor()
    .shape("path", d3.symbol().type(d3.symbolCircle).size(70)())
    .scale(ordinal)

    svg.select(".legendOrdinal")
      .attr("id", "legendOrdinal")
      .call(legendOrdinal);
      svg.select(".legendOrdinal").selectAll("text").style("fill", "silver");
  }



  function translate(x, y) {
    return "translate(" + String(x) + "," + String(y) + ")";
  }

}

function mapFilter(category) {
  const police = d3.select("body").select("svg#vis").select("g#police");
  const symbols = police.selectAll("circle")
  if (symbols.filter(d => (d.subcat == category)).style("visibility") == "hidden") {
    symbols.filter(d => (d.subcat == category)).transition().style("visibility", "visible");
  } else {
    symbols.filter(d => (d.subcat == category)).transition().style("visibility", "hidden");
  }
}
