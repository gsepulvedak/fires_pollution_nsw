window.onload = function () {
    
    // date parser for data loading
    var parseDate = d3.timeParse("%Y-%m-%d"),
        date2string = d3.timeFormat("%Y-%m-%d");
    
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
                
                // draw PM10 and PM2.5 paths
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
            
                // focus on line plots hovering
                var circle1 = d3.select(id)
                        .append("circle")
                        .attr("cx", 0)
                        .attr("cy", 0)
                        .attr("r", 3)
                        .attr("opacity", 0)
                        .attr("fill", "black"),
                    
                    // line that helps to roughly check PM concentration
                    line1 = d3.select(id)
                                .append("line"),
                    
                    // focus on burnt area plot (helps to check time of PM measurements)
                    line2 = d3.select("#burntarea")
                                .append("line");
            
                    circle2 = d3.select("#burntarea")
                                .append("circle")
                                .attr("r", 3)
                                .attr("cy", aqplotHeight/5 - margin.bottom)
                                .attr("fill", "#ea1717")
                                .attr("opacity", 0);
                
                // get coordinates of path to draw circle accordingly (based on http://bl.ocks.org/methodofaction/3824661)
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
    
    // ---- BURNT AREA PLOT -----
    
    var burntWidth = 700,
        burntHeight = 650,
        burntParser = function(d){
            return {
                date: parseDate(d.date),
                area: parseFloat(d.area),
                cum_area: parseFloat(d.cum_area)
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
                        .range([margin.left, burntWidth - margin.right]),
        
            yScale = d3.scaleLinear()
                            .domain(d3.extent(d, function(v){return v.cum_area}))
                            .range([burntHeight/5 - margin.bottom, margin.top]),
        
            xAxis = d3.axisBottom()
                        .scale(xScale),
        
            yAxis = d3.axisLeft()
                            .scale(yScale)
                            .ticks(3)
                            .tickFormat(d3.format(".2s")),
            
            area = d3.area()
                        .x(function(d){return xScale(d.date)})
                        .y0(yScale(0))
                        .y1(function(d){return yScale(d.cum_area)});
            
        // add area path
        svgBurnt.append("path")
            .datum(d)
                .attr("stroke", "#db7979")
                .attr("fill", "#db7979")
                .attr("d", area);
        
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
    
    // MAP VARIABLES
    var mapWidth = 700,
        mapHeight = 650,
        
        // add base map
        map = L.map("map").setView([-34, 149.8], 6),
        tiles = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abcd',
            minZoom: 4,
            maxZoom: 12,
            ext: 'png'
        }).addTo(map);
    
    L.svg({clickable:true}).addTo(map);
    
    var overlay = d3.select(map.getPanes().overlayPane),
        svgMap = overlay.select("svg").attr("pointer-events", "auto"),
        g = svgMap.append("g").attr("class", "leaflet-zoom-hide");
    
    // FIRE FREQUENCY BAR PLOT VARIABLES
    var firefreqWidth = 1410,
        firefreqHeight = 150,
        svgFreq = d3.select("#firefreq")
                    .append("svg")
                    .attr("width", firefreqWidth)
                    .attr("height", firefreqHeight)
                    .attr("id", "svg_ff"),
        
        margin = {left: 35, top: 10, right: 30, bottom: 20},
        barPadding = 1;
        
        firefreqParser = function(csv){
        return {
            date: parseDate(csv.date),
            dateString: csv.date,
            dayFreq: parseInt(csv.dayFreq),
            active: parseInt(csv.active_fires)
        };
    };
    
    //read fire frequency csv
    d3.csv("data/firesFreq.csv", firefreqParser, function(csv){
        
        // read fire ploygons data 
        d3.json("data/firespoly.json", function(d){

            
            // FIRE PLOT
            
            // reproject d3 geopath into leaflet's projection function
            var projectPoint = function(x, y) {
                    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
                    this.stream.point(point.x, point.y);
                };

            // apply projection conversion
            var transform = d3.geoTransform({point: projectPoint}),
                poly = d3.geoPath().projection(transform),
                format = d3.format(",");

            // add polygons to base map
            var polygons = g.selectAll("path")
                                .data(d.features)
                                .enter()
                                .append("path")
                                    .attr("stroke", "grey")
                                    .attr("fill", "orange")
                                    .attr("opacity", 0.7)
                                    .attr("z-inedx", 2)
                                    .attr("class", "leaflet-interactive")

                                    // tooltip
                                    .on("mouseover", function(d){
                                        
                                        if (notClicked){
                                            d3.select(this).attr("fill", "red");
                                        }

                                        var xPosition = d3.event.pageX,
                                            yPosition = d3.event.pageY;
                                        

                                        d3.select("#map_tooltip")
                                            .style("left", (xPosition + 30) + "px")
                                            .style("top", (yPosition - 40) + "px")
                                            .style("z-index", 999)
                                            .select("#fireName").text(d.properties.FireName);

                                        d3.select("#dateRange")
                                            .text(d.properties.StartDate + " - " + d.properties.EndDate + " (" + d.properties.Duration + " days)");
                                        d3.select("#burntArea").text(format(Math.round(d.properties.AreaHa)) + " Ha");

                                        d3.select("#map_tooltip")
                                            .classed("hidden", false);
                                    })

                                    .on("mouseout", function(d){
                                        if(notClicked){
                                            d3.select(this).attr("fill", "orange");
                                        }
                                        d3.select("#map_tooltip")
                                                .classed("hidden", true);
                                        
                                    });

            // re-render polygons function
            var update = function(){
                polygons
                    .attr("d", poly);
            };

            // update polygons on map interaction
            map.on("moveend", update);

            // execute
            update();
        
            // FIRE FREQUENCY BAR PLOT
            
            // axes scale
            var xScale = d3.scaleTime()
                            .domain(d3.extent(csv, function(v) {return v.date}))
                            .range([margin.left, firefreqWidth - margin.right]);

            var yScale_ff = d3.scaleLinear()
                            .domain(d3.extent(csv, function(v) {return v.dayFreq}))
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
                .data(csv)
                .enter()
                .append("rect")
                    .attr("x", function(v){return xScale(v.date)})
                    .attr("y", function(v){return yScale_ff(v.dayFreq)})
                    .attr("width", firefreqWidth / csv.length - barPadding) 
                    .attr("height", function(v){return firefreqHeight - margin.bottom - yScale_ff(v.dayFreq)})
                    .attr("fill", "orange")

                    // interaction
                    .on("mouseover", mouseover)
                    .on("mouseout", mouseout)
                    .on("click", click);

            // draw axes
            svgFreq.append("g")
                .attr("transform", "translate(0," + (firefreqHeight - margin.bottom) + ")")
                .call(xAxis);

            svgFreq.append("g")
                .attr("transform", "translate(" + margin.left + ", 0)")
                .call(yAxis_ff);
            
            var notClicked = true;
            
            function mouseover(csv){
                if(notClicked){
                        // map interaction: highlight fires started on that date             
                        var fireDate = date2string(csv.date);
                        
                        
                        g.selectAll("path")
                            .attr("fill", function(v){
                            if (v.properties.StartDate == fireDate) {
                                return "red"
                            } else {
                                return "orange"
                            }
                        });

                        // bar interaction and tooltip
                        d3.select(this)
                            .attr("fill", "#aa2323");

                        var xPosition = d3.event.pageX + 10;

                        d3.select("#firefreq_tooltip")
                            .style("left", xPosition + "px")
                            .style("bottom", "138px")
                            .select("#fireDate").text(csv.dateString);

                        d3.select("#firesStarted").text(csv.dayFreq);
                        d3.select("#activeFires").text(csv.active);

                        d3.select("#firefreq_tooltip")
                            .classed("hidden", false);

                        // AQ plot interaction
                        var newXscale = xScale.range([margin.left, aqplotWidth - margin.right]);

                        d3.selectAll("#aq2, #aq3, #aq4")
                            .append("line")
                            .attr("id", "aqInd")
                            .attr("x1", newXscale(csv.date))
                            .attr("y1", 0)
                            .attr("x2", newXscale(csv.date))
                            .attr("y2", aqplotHeight/5)
                            .attr("stroke", "blue");

                        d3.selectAll("#aq1")
                            .append("line")
                            .attr("id", "aq2Ind")
                            .attr("x1", newXscale(csv.date))
                            .attr("y1", margin.top)
                            .attr("x2", newXscale(csv.date))
                            .attr("y2", aqplotHeight/5)
                            .attr("stroke", "blue");

                        d3.selectAll("#burntarea")
                            .append("line")
                            .attr("id", "areaInd")
                            .attr("x1", newXscale(csv.date))
                            .attr("y1", 0)
                            .attr("x2", newXscale(csv.date))
                            .attr("y2", aqplotHeight/5 - margin.bottom)
                            .attr("stroke", "blue");
                    }
            }
            function mouseout(){
                    
                if (notClicked){
                    d3.select("#firefreq_tooltip")
                        .classed("hidden", true);
                    d3.select(this)
                            .attr("fill", "orange");
                    d3.selectAll("#aqInd, #aq2Ind, #areaInd").remove();
                    g.selectAll("path")
                        .attr("fill", "orange");
                };
                
            };
            
            function click(csv){
                                                
                notClicked = !notClicked;
                
                if(!notClicked){
                    var fireDate = date2string(csv.date);
                
                    g.selectAll("path")
                        .attr("fill", function(v){
                        if (v.properties.StartDate <= fireDate && v.properties.EndDate < fireDate){
                            return "black"
                        } else if (v.properties.StartDate <= fireDate && v.properties.EndDate > fireDate){
                            return "red"
                        } else {
                            return "none"
                        }
                    });
                }
                
            }
            
            svgFreq.on("click", function(){
                if (notClicked){
                    d3.select(this).selectAll("rect").attr("fill", "orange");
                    notClicked = true;
                }
                
                
            });
        });    
        
    });

};