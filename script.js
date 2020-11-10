window.onload = function () {
    
    
    // ---- FIRES FREQUENCY BAR PLOT -----
    
    var parseDate = d3.timeParse("%Y-%m-%d"),
        firefreqWidth = 1410,
        firefreqHeight = 200,
        svgFreq = d3.select("#firefreq")
                    .append("svg")
                    .attr("width", firefreqWidth)
                    .attr("height", firefreqHeight),
        
        margin = {left: 30, top: 10, right: 30, bottom: 20},
        barPadding = 1;
        
        firefreqParser = function(d){
        return {
            date: parseDate(d.date),
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
                .attr("fill", "orange");
        
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
    var ids = ["aq1", "aq2", "aq3", "aq4", "burntArea"]
    ids.forEach(addSvg);
    
    // generate plots
    d3.csv("data/aqplot.csv", aqplotParser, function(d){
       
        console.log(filterData(d, 1, "PM25"));
        
        var xScale = d3.scaleTime()
                        .domain(d3.extent(d, function(v) {return v.date}))
                        .range([margin.left, aqplotWidth - margin.right]);
        
        var aqplotYscale = d3.scaleLinear()
                            .domain(d3.extent(d, function(v){return v.value}))
                            .range([aqplotHeight/5 - margin.bottom, margin.top]);
        
        var yAxis_aq = d3.axisLeft()
                            .scale(aqplotYscale)
                            .ticks(5);
        
        // create line generator
        var line = d3.line()
                        .x(function(d){return xScale(d.date)})
                        .y(function(d){return aqplotYscale(d.value)});
        
        var addLine = function(id, group, param){
            
                var classStyle = "line " + param;
            
            
                d3.select(id)
                    .append("path")
                    .datum(filterData(d, group, param))
                    .attr("class", classStyle)
                    .attr("d", line);
            
        };
        
        
        const obj = {"#aq1":4, "#aq2":3, "#aq3":2, "#aq4":1};
        
        for (var key in obj){
            
            var value = obj[key];
            addLine(key, value, "PM10");
            addLine(key, value, "PM25");
            
            d3.select(key)
                .append("g")
                    .attr("transform", "translate(" + margin.left + ", 0)")
                    .call(yAxis_aq);
            
        }
        
        
        
        
        
    });
    
    
    
};