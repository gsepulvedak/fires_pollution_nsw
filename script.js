window.onload = function () {
    
    
    // ---- FIRES FREQUENCY BAR PLOT -----
    
    var parseDate = d3.timeParse("%Y-%m-%d"),
        width = 1410,
        height = 200,
        svgFreq = d3.select("#firefreq")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height),
        
        margin = {left: 20, top: 10, right: 30, bottom: 20},
        barPadding = 1;
        
        rowParser = function(d){
        return {
            date: parseDate(d.date),
            dayFreq: parseInt(d.dayFreq),
            active: parseInt(d.active_fires)
        };
    };
    
    // Create visualisation
    d3.csv("data/firesFreq.csv", rowParser, function(d){
       
        // axes scale
        var xScale = d3.scaleTime()
                        .domain(d3.extent(d, function(v) {return v.date}))
                        .range([margin.left, width - margin.right]);
        
        var yScale = d3.scaleLinear()
                        .domain(d3.extent(d, function(v) {return v.dayFreq}))
                        .range([height - margin.bottom, margin.top]);
        
        // axes
        var xAxis = d3.axisBottom()
                        .scale(xScale);
//                        .ticks(20); // a bit of customisation

        var yAxis = d3.axisLeft()
                        .scale(yScale);
//                        .ticks(14); // a bit of customisation
        
        console.log(yScale(19));
//        console.log(margin.top);
        
        // draw bars
        svgFreq.selectAll("rect")
            .data(d)
            .enter()
            .append("rect")
                .attr("x", function(v){return xScale(v.date)})
                .attr("y", function(v){return yScale(v.dayFreq)})
                .attr("width", width / d.length - barPadding) 
                .attr("height", function(v){return height - margin.bottom - yScale(v.dayFreq)})
                .attr("fill", "orange");
        
        // draw axes
        svgFreq.append("g")
            .attr("transform", "translate(0," + (height - margin.bottom) + ")")
            .call(xAxis);
        
        svgFreq.append("g")
            .attr("transform", "translate(" + margin.left + ", 0)")
            .call(yAxis);
        
    });
    
    
    
    
};