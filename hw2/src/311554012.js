// Load the dataset
d3.csv('../data/iris.csv').then(data => {
    // Preprocess the data type
    data.forEach(d => {
        d['petal length'] = +d['petal length'];
        d['petal width'] = +d['petal width'];
        d['sepal length'] = +d['sepal length'];
        d['sepal width'] = +d['sepal width'];
    });

    // Parallel Coordinate Plot
    render(data);
});

// Parallel Coordinate Plot
// Define the SVG dimensions and margins 
const margin = { top: 20, right: 30, bottom: 40, left:50};
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select('#parallel-coordinate-plot')
    .append('svg')
    .attr('width', 900)
    .attr('height', 500)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// Render Function
const render = data => {
    // Extract unique species for color mapping
    const species = [new Set(data.map(d => d.class))];

    // Create color scale
    const colorScale = d3.scaleOrdinal()
        .domain(species)
        .range(d3.schemeCategory10);
    
    // Extract each name of features
    const columns = Object.values(data.columns).slice(0, 4);

    // Create scales for X and Y axes
    const xScale = d3.scalePoint()
            .domain(columns)
            .range([0, width]);

    const yScale = {};
    columns.forEach(col_name => {
        yScale[col_name] = d3.scaleLinear()
            // .domain(d3.extent(data, d => d[col_name]))
            .domain([0, 8])
            .range([height, 0])
            .nice();
    });

    // Create and initialize the tooltip
    const tooltip = d3.select('#tooltip')
        .style('position', 'absolute')
        .style('background-color', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('padding', '10px')
        .style('display', 'none')
        .style('font-size', '0.85rem');
    
    // Highlight the specie that is hovered
    var highlight = function(event, d){
        // first every group turns gray
        d3.selectAll('.line')
            .transition().duration(200)
            .style('stroke', 'lightgray')
            .style('opacity', '0.2');
        // Second the hovered specie takes its color
        d3.selectAll('.' + d.class)
            .transition().duration(200)
            .style('stroke', colorScale(d.class))
            .style('opacity', '1');
        // Show the tooltip
        tooltip.style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 25) + 'px')
            .style('display', 'block')
            .html(`<strong>class:</strong> <span style="color:${colorScale(d.class)}">${d.class}</span>`);
    };

    // Unhighlight
    var doNotHighlight = function(event, d){
        d3.selectAll('.line')
            .transition().duration(200).delay(300)
            .style('stroke', function(d){ return( colorScale(d.class))} )
            .style('opacity', '1')
        // Hide the tooltip
        tooltip.style('display', 'none');
    };

    // `position`: obtain the corresponding x coordinate whenever the user move the axis
    var dragging = {};
    function position(d){
        return dragging[d] == null ? xScale(d) : dragging[d];
    };

    // `path`: take a row of the csv as input, and return x and y coordinates of the line to draw for this raw
    function path(d) {
        return d3.line()(columns.map(p => [position(p), yScale[p](d[p])]));
    };    

    //Draw the lines
    const pathGroup = svg.selectAll('path')
        .data(data)
        .join('path')
            .attr('class', d => `line ${d.class}`)
            .attr('d', path)
            .style('fill', 'none')
            .style('stroke', d => colorScale(d.class))
            .style('opacity', 0.5)
            .on('mouseover', highlight)
            .on('mouseleave', doNotHighlight);

    // Draw the axes
    // `drag`: the event when the user move the axis
    const drag = function(event, d) {
        pathGroup.attr('d', path);
        // Use d3.pointer to access the x-coordinate
        const [x] = d3.pointer(event);
        dragging[d] = Math.min(width+10, Math.max(-10, x-10)); // Limits the interact range 
        console.log(dragging);

        // Update the columns order
        columns.sort((a, b) => position(a) - position(b));
        xScale.domain(columns);
        // Update the axes
        axisGroup.attr('transform', d => `translate(${position(d)})`)
    }

    const axisGroup = svg.selectAll('axis')
        // Add 'g' element for each column:
        .data(columns).enter().append('g')
        .attr('class', 'axis')
        // translate the element to the right position on the x-axis
        .attr('transform', d => `translate(${xScale(d)})`)
        // Build the axis with the call function
        .each(function(d) { 
            d3.select(this)
                .call(d3.axisLeft().ticks(5).scale(yScale[d]))
                .style('font-size', '12px')
                .style('color', '#9a9c9a');
        })
        // dragging listener
        .call(d3.drag()
            .on('start', function(event, d) {
                dragging[d] = xScale(d);
                console.log(dragging);
            })
            .on('drag', drag)
            .on('end', function(event, d) {
                delete dragging[d];
                pathGroup
                    .transition().duration(500)
                    .attr('d', path);
                d3.select(this)
                    .transition().duration(500)
                    .attr('transform', d => `translate(${position(d)})`)
            })
        );

    // Add axes title
    axisGroup.append('text')
        .attr('class', 'axis')
        .style('text-anchor', 'middle')
        .attr('y', height+20)
        .text(d => d)
        .style('fill', '#9a9c9a')
        .style('font-size', '14px');
};