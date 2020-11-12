window.onload = function () {
    
    // date parser for data loading
    var parseDate = d3.timeParse("%Y-%m-%d");
    
    // ---- FIRES FREQUENCY BAR PLOT -----
    
    var firefreqWidth = 1410,
        firefreqHeight = 200,
        svgFreq = d3.select("#firefreq")
                    .append("svg")
                    .attr("width", firefreqWidth)
                    .attr("height", firefreqHeight),
        
        margin = {left: 35, top: 10, right: 30, bottom: 20},
        barPadding = 1;
        
        firefreqParser = function(d){
        return {
            date: parseDate(d.date),
            dateString: d.date,
            dayFreq: parseInt(d.dayFreq),
            active: parseInt(d.active_fires)
        };
    };
    
    // Create visualisation
    d3.csv("data/firesFreq.csv", firefreqParser, function(d){
       
        // axes scale
        var xScale = d3.scaleTime()
                        .domain(d3.extent(d, function(v) {return v.date}))
                        .range([margin.left, firefreqWidth - margin.right]);
        
        var yScale_ff = d3.scaleLinear()
                        .domain(d3.extent(d, function(v) {return v.dayFreq}))
                        .range([firefreqHeight - margin.bottom, margin.top]);
        
        // axes
        var xAxis = d3.axisBottom()
                        .scale(xScale);
//                        .ticks(20); // a bit of customisation

        var yAxis_ff = d3.axisLeft()
                        .scale(yScale_ff);
//                        .ticks(7); // a bit of customisation
        
        
        // draw bars
        svgFreq.selectAll("rect")
            .data(d)
            .enter()
            .append("rect")
                .attr("x", function(v){return xScale(v.date)})
                .attr("y", function(v){return yScale_ff(v.dayFreq)})
                .attr("width", firefreqWidth / d.length - barPadding) 
                .attr("height", function(v){return firefreqHeight - margin.bottom - yScale_ff(v.dayFreq)})
                .attr("fill", "orange")
        
                //tooltip
                .on("mouseover", function(d){
            
                    d3.select(this)
                        .attr("fill", "#aa2323");
                    
                    var xPosition = d3.mouse(this)[0];
            
                    d3.select("#firefreq_tooltip")
                        .style("left", xPosition + "px")
                        .style("bottom", "138px")
                        .select("#fireDate").text(d.dateString);
            
                    d3.select("#firesStarted").text(d.dayFreq);
                    d3.select("#activeFires").text(d.active);
                    
                    d3.select("#firefreq_tooltip")
                        .classed("hidden", false);
        })
                .on("mouseout", function(){
                    d3.select("#firefreq_tooltip")
                        .classed("hidden", true);
                    d3.select(this)
                        .attr("fill", "orange");
        });
        
        // draw axes
        svgFreq.append("g")
            .attr("transform", "translate(0," + (firefreqHeight - margin.bottom) + ")")
            .call(xAxis);
        
        svgFreq.append("g")
            .attr("transform", "translate(" + margin.left + ", 0)")
            .call(yAxis_ff);
        
    });
    
    
    // ---- AIR QUALITY LINE PLOTS -----
    
    var aqplotWidth = 700,
        aqplotHeight = 650,
        
        addSvg = function(id){
            
            var aqplotWidth = 700,
                aqplotHeight = 650;
            
            d3.select("#aqplot")
                .append("svg")
                .attr("width", aqplotWidth)
                .attr("height", aqplotHeight/5)
                .attr("id", id)
                .style("display", "block")
        },
        
        aqplotParser = function(d){
            return {
                date: parseDate(d.Date),
                lat_group: parseInt(d.lat_group),
                param: d.param,
                value: parseFloat(d.value)
            };
        },
        
        // latitude group filtering
        filterData = function(d, group, param){
            return d.filter(function(v){return (v.lat_group == group && v.param == param)})
        };
    
    // add svg
    var ids = ["aq1", "aq2", "aq3", "aq4"]
    ids.forEach(addSvg);
    
    // generate plots
    d3.csv("data/aqplot.csv", aqplotParser, function(d){
       
        // scales and axes
        var xScale = d3.scaleTime()
                        .domain(d3.extent(d, function(v) {return v.date}))
                        .range([margin.left, aqplotWidth - margin.right]);
        
        var aqplotYscale = d3.scaleLinear()
                            .domain(d3.extent(d, function(v){return v.value}))
                            .range([aqplotHeight/5 - margin.bottom, margin.top]);
        
        var yAxis_aq = d3.axisLeft()
                            .scale(aqplotYscale)
                            .ticks(5);
        
        // line generator
        var line = d3.line()
                        .x(function(d){return xScale(d.date)})
                        .y(function(d){return aqplotYscale(d.value)});
        
        // helper function for adding lines and other functionality
        var addLine = function(id, group){
                
                // parameters path
                var path1 = d3.select(id)
                            .append("path")
                            .datum(filterData(d, group, "PM10"))
                            .attr("class", "line PM10")
                            .attr("d", line),
            
                    path2 = d3.select(id)
                            .append("path")
                            .datum(filterData(d, group, "PM25"))
                            .attr("class", "line PM25")
                            .attr("d", line);
            
                // focus on line plots
                var circle1 = d3.select(id)
                        .append("circle")
                        .attr("cx", 0)
                        .attr("cy", 0)
                        .attr("r", 3)
                        .attr("opacity", 0)
                        .attr("fill", "black"),
                    
                    line1 = d3.select(id)
                                .append("line"),
                    
                    // focus on burnt area plot
                    line2 = d3.select("#burntarea")
                                .append("line");
            
                    circle2 = d3.select("#burntarea")
                                .append("circle")
                                .attr("r", 3)
                                .attr("cy", aqplotHeight/5 - margin.bottom)
                                .attr("fill", "#ea1717")
                                .attr("opacity", 0);
                
                
                var pathElem1 = path1.node(),
                    pathElem2 = path2.node(),
                    pathLength1 = pathElem1.getTotalLength() - margin.right,
                    pathLength2 = pathElem2.getTotalLength() - margin.right,
                    offsetLeft = document.getElementById("aqplot").offsetLeft;
            

                d3.select(id)
                    .on("mousemove", function(){
                        var x = d3.mouse(this)[0],
                            start = x,
                            end = pathLength1,
                            target;

                        while(true) {
                            target = Math.floor((start + end) / 2);
                            pos1 = pathElem1.getPointAtLength(target);
                            if ((target === end || target === start) && pos1.x !== x) {
                                break;
                            }
                            if (pos1.x > x)      end = target;
                            else if (pos1.x < x) start = target;
                            else                break;
                        }

                        circle1
                            .attr("opacity", 1)
                            .attr("cx", x)
                            .attr("cy", pos1.y);
                    
                        line1  
                            .attr("x1", margin.left)
                            .attr("y1", pos1.y)
                            .attr("x2", x-3)
                            .attr("y2", pos1.y)
                            .attr("stroke", "grey")
                            .attr("opacity", 1)
                    
                        line2
                            .attr("x1", x)
                            .attr("y1", margin.top)
                            .attr("x2", x)
                            .attr("y2", aqplotHeight/5 - margin.bottom)
                            .attr("stroke", "#ea1717")
                            .attr("opacity", 1);
                    
                        circle2
                            .attr("cx", x)
                            .attr("opacity", 1);
                            
                })
                    .on("mouseout", function(){
                        circle1.attr("opacity", 0);
                        line1.attr("opacity", 0);
                        line2.attr("opacity", 0);
                        circle2.attr("opacity", 0);
                });
                
            console.log(circle1);    
        };
        
        // add lines to svg
        const obj = {"#aq1":4, "#aq2":3, "#aq3":2, "#aq4":1};
        
        for (var key in obj){
            
            var value = obj[key];
            addLine(key, value);
//            addLine(key, value, "PM25");
            
            // and y axis
            d3.select(key)
                .append("g")
                    .attr("transform", "translate(" + margin.left + ", 0)")
                    .call(yAxis_aq);
        }
        
        // values over path. Based on http://bl.ocks.org/methodofaction/3824661
        
        
            
        
    });
    
    // ---- BURNT AREA BAR PLOT -----
    
    var burntWidth = 700,
        burntHeight = 650,
        burntParser = function(d){
            return {
                date: parseDate(d.date),
                area: parseFloat(d.area)
            };
        };
    
    var svgBurnt = d3.select("#aqplot")
                        .append("svg")
                        .attr("width", burntWidth)
                        .attr("height", burntHeight/5)
                        .attr("id", "burntarea")
                        .style("display", "block")
    
    // generate plot
    d3.csv("data/burntarea.csv", burntParser, function(d){
        
        // scales and axes
        var xScale = d3.scaleTime()
                        .domain(d3.extent(d, function(v) {return v.date}))
                        .range([margin.left, burntWidth - margin.right]);
        
        var yScale = d3.scaleLinear()
                            .domain(d3.extent(d, function(v){return v.area}))
                            .range([burntHeight/5 - margin.bottom, margin.top]);
        
        var xAxis = d3.axisBottom()
                        .scale(xScale);
        
        var yAxis = d3.axisLeft()
                            .scale(yScale)
                            .ticks(3)
                            .tickFormat(d3.format(".2s"));
        
        
        // add bars
        svgBurnt.selectAll("rect")
            .data(d)
            .enter()
            .append("rect")
                .attr("x", function(v){return xScale(v.date)})
                .attr("y", function(v){return yScale(v.area)})
                .attr("width", burntWidth / d.length - barPadding) 
                .attr("height", function(v){return burntHeight/5 - margin.bottom - yScale(v.area)})
                .attr("fill", "grey");
        
        //add axes
        d3.select("#burntarea")
            .append("g")
            .attr("transform", "translate(0,"  + (burntHeight/5 - margin.bottom) + ")")
            .call(xAxis);
        
        d3.select("#burntarea")
            .append("g")
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(yAxis);
        
    });
    
    // ---- FIRES MAP. Based on Mike Bostock's tutorial at https://bost.ocks.org/mike/leaflet/-----
    
    var mapWidth = 700,
        mapHeight = 650,
        
        // add base map
        map = L.map("map").setView([-32.6, 149.8], 6),
        tiles = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abcd',
            minZoom: 4,
            maxZoom: 12,
            ext: 'png'
        }).addTo(map);
    
    
    var svgMap = d3.select(map.getPanes().overlayPane).append("svg"),
        g = svgMap.append("g").attr("class", "leaflet-zoom-hide");
    
    // read ploygon data 
    d3.json("data/firespoly.json", function(d){
        
        // reproject d3 geopath into leaflet's projection function
        var projectPoint = function(x, y) {
                var point = map.latLngToLayerPoint(new L.LatLng(y, x));
                this.stream.point(point.x, point.y);
            };
        
        // apply projection conversion
        var transform = d3.geoTransform({point: projectPoint}),
            poly = d3.geoPath().projection(transform);
        
        // add polygons selections to be updated over base map
        var polygons = g.selectAll("path")
                            .data(d.features)
                            .enter()
                            .append("path")
                                .attr("stroke", "grey")
                                .attr("fill", "orange")
                                .attr("opacity", 0.7);
        
        // update svg size and relocate polygons group
        var update = function(){
            
             // fit svg size to map view
            var bounds = poly.bounds(d),
                topLeft = bounds[0],
                bottomRight = bounds[1];

            svgMap.attr("width", bottomRight[0] - topLeft[0])
                    .attr("height", bottomRight[1] - topLeft[1])
                    .style("left", topLeft[0] + "px")
                    .style("top", topLeft[1] + "px");

            g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
            
            polygons.attr("d", poly);
            
        };
        
        // update polygons and svg size on map interaction
        map.on("moveend", update);
        
        // execute
        update();
        
    });
    
 
    
};