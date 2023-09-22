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

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw
    function path(d) {
        return d3.line()(columns.map(p => [xScale(p), yScale[p](d[p])]));
    };    

    //Draw the lines
    svg.selectAll('path')
        .data(data)
        .join('path')
            .attr('class', d => `line ${d.class}`)
            .attr('d', path)
            .style('fill', 'none')
            .style('stroke', d => colorScale(d.class))
            .style('opacity', 0.5);

    // Draw the axis
    svg.selectAll('axis')
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
        // Add axis title
        .append('text')
            .style('text-anchor', 'middle')
            .attr('y', height+20)
            .text(d => d)
            .style('fill', '#9a9c9a')
            .style('font-size', '14px');
};