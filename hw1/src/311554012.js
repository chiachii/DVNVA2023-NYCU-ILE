// Load the dataset
d3.csv('../data/iris.csv').then(data => {
    // Preprocess the data type
    data.forEach(d => {
        d['petal length'] = +d['petal length'];
        d['petal width'] = +d['petal width'];
        d['sepal length'] = +d['sepal length'];
        d['sepal width'] = +d['sepal width'];
    });

    // Control Bar
    controller(data);

    // Scatter Plot
    render(data);

    // For check
    // console.log(data);
});

// Control Bar
const controller = data => {
    const attributions = Object.keys(data[0]).filter(d => d !== 'class');
    
    // X-Axis dropdown
    d3.select('#x-axis-select')
        .selectAll('option')
        .data(attributions)
        .enter()
        .append('option')
        .text(d => d)
        .attr('value', d => d);

    // Y-Axis dropdown
    d3.select('#y-axis-select')
        .selectAll('option')
        .data(attributions)
        .enter()
        .append('option')
        .text(d => d)
        .attr('value', d => d);
};

// Scatter Plot
// Define the SVG dimensions and margins 
const margin = { top: 20, right: 30, bottom: 40, left:50};
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select('#scatter-plot')
    .append('svg')
    .attr('width', 800)
    .attr('height', 500)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// Default Axes (Features)
const xAttribute = 'sepal_length';
const yAttribute = 'sepal_length';

// Render Function
const render = data => {
    // Create scales for X and Y axes
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[xAttribute]))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[yAttribute]))
        .range([height, 0]);

    // Create X and Y axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Append X and Y axes to the SVG
    svg.append('g')
        .style('font-size', '12px')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis);

    svg.append('g')
        .style('font-size', '12px')
        .attr('class', 'y-axis')
        .call(yAxis);

    // Extract unique species for color mapping
    const species = [new Set(data.map(d => d.class))];

    // Create color scale
    const colorScale = d3.scaleOrdinal()
        .domain(species)
        .range(d3.schemeCategory10);

    // Create scatter plot circles with class-based colors
    svg.selectAll('circle').data(data)
        .enter().append('circle')
        .attr('cx', d => xScale(+d[xAttribute]))
        .attr('cy', d => yScale(+d[yAttribute]))
        .attr('r', 0)
        .attr('class', 'data-point')
        .style('fill', d => colorScale(d.class)); // Differentiate by `class`
    
    // Update the scatter plot when X or Y changes
    d3.selectAll('select').on('change', function() {
        const newXAttribute = d3.select('#x-axis-select').property('value');
        const newYAttribute = d3.select('#y-axis-select').property('value');
        
        // Update X and Y scales
        xScale.domain(d3.extent(data, d => +d[newXAttribute]));
        yScale.domain(d3.extent(data, d => +d[newYAttribute]));

        // Update X and Y axes
        svg.select('.x-axis')
            .transition()
            .duration(500)
            .call(xAxis);

        svg.select('.y-axis')
            .transition()
            .duration(500)
            .call(yAxis);
        
        // Update circle positions
        svg.selectAll('circle')
            .filter(d => d[newYAttribute] !== '')
            .transition()
            .duration(500)
            .attr('r', 5)
            .attr('cx', d => xScale(+d[newXAttribute]))
            .attr('cy', d => yScale(+d[newYAttribute]));
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

    // Select the label elements where you want to display the selected values
    const xAxisLabel = d3.select('#x-axis-label');
    const yAxisLabel = d3.select('#y-axis-label');

    // Add event listeners to show/hide the tooltip
    svg.selectAll('.data-point')
        .on('mouseover', function(event, d) {
            // Obtain `cxValue`, `cyValue`, `classValue`
            const xAttribute = d3.select('#x-axis-select').property('value');
            const yAttribute = d3.select('#y-axis-select').property('value');
            const cxValue = d[xAttribute]; // Use the data object directly to access the `cx` value
            const cyValue = d[yAttribute]; // Use the data object directly to access the `cy` value
            const classValue = d.class;
            
            // Highlight the point by changing its fill color
            d3.select(this)
                .transition()
                .duration(100)
                .style('fill', 'pink');

            // Show the values of X-Axis and Y-Axis
            xAxisLabel.text(`= ${cxValue}`);
            yAxisLabel.text(`= ${cyValue}`);
            // Show the tooltip
            tooltip.style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 25) + 'px')
                .style('display', 'block')
                .html(`<strong>class:</strong> ${classValue}`);
        })
        .on('mouseout', function() {
            // Change it back to the class-based color
            d3.select(this)
                .transition()
                .duration(100)
                .style('fill', d => colorScale(d.class));

            // Hide the values of X-Axis and Y-Axis
            xAxisLabel.text('');
            yAxisLabel.text('');
            // Hide the tooltip
            tooltip.style('display', 'none');
        });    
};