// Load the dataset
d3.csv('../data/TIMES_WorldUniversityRankings_2024.csv').then(data => {
    // Define the default (global) value: `order`, `amount`
    var order = 'descending';
    var amount = '201';

    // `amount-selector`: re-plot based on change of the `amount-select` selector
    const amountSelect = d3.select('#amount-select');
    const amountOptions = Object.keys([...Array(201).keys()]);
    
    amountSelect.selectAll('option')
        .data(amountOptions)
        .enter()
        .append('option')
        .text(d => d)
        .attr('value', d => d);

    d3.select('#amount-select').on('change', function() {
        amount = +this.value; // Global Scope

        // Update charts
        svg.selectAll('g').remove();
        render(data, order, amount);
    });

    // `order-selector`: re-plot based on change of the `order-select` selector
    d3.select('#order-select').on('change', function() {
        order = this.value; 

        // Update charts
        svg.selectAll('g').remove();
        render(data, order, amount);
    });

    // Initialization
    render(data, order, amount);
});

// Build the Stacked Bar Charts
// Define the SVG dimensions and margins 
const margin = { top: 20, right: 20, bottom: 20, left: 20};
const width = 1300 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select('#stacked-bar-chart')
    .append('svg')
    .attr('width', 1400)
    .attr('height', 540)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// Render Function
const render = (data, order, amount) => {
    // `groups`: the name of each school 
    const groups = data.map(d => (d.name)).slice(0, +amount);

    // `subgroups`: the header we need in the csv file
    var subgroups = data.columns.slice(2, 14).filter(item => !item.includes('rank'));

    // Preprocessing: delete rows without the value of 'score_overall'
    data.forEach(d => {
        if (isNaN(d['rank']) && d['rank'].startsWith('=')) {
            // d['rank'] = parse(d['rank'].substring(1));
            d['rank'] = d['rank'].replace('=', '');
        }
    });
    data = data.filter(d => !isNaN(d['rank'])).slice(0, +amount);
    // console.log(data);

    // Add X axis
    if (order === 'ascending') {
        var xValue = data.map(d => (d.rank)).toReversed();
    } else {
        var xValue = data.map(d => (d.rank));
    };

    const xScale = d3.scaleBand()
        .domain(xValue)
        .range([0, width])
        .padding([0.5]);

    svg.append('g')
        .attr('transform', `translate(30, ${height})`)
        .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('font-size', 10)
            .style('text-anchor', 'end')
            .attr('dx', '-1em')
            .attr('dy', '-0.6em')
            .attr('transform', 'rotate(-90)');

    // Add Y axis
    const yScale = d3.scaleLinear()
        .domain([0, 600])
        .range([height, 0]);
        
    svg.append('g')
        .attr('transform', `translate(30, 0)`)
        .call(d3.axisLeft(yScale));
    
    // colorScale = one color per subgroup
    const colorScale = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#9ac8eb', '#d9a7c7', '#81C784', '#f3c7d5', '#90A4AE', '#f9c995']);

    // Stack the data? --> stack per subgroup
    const stackedData = d3.stack()
        .keys(subgroups)
        (data);
    // console.log(stackedData)
    
    // Show the bars
    svg.append('g')
        .selectAll('g')
        .data(stackedData) // Enter in the stack data
        .join('g')
            .attr('fill', d => colorScale(d.key))
            .selectAll('rect')
            .data(d => d) // Add all rectangles: loop based on subgroup
            .join('rect')
            .attr('x', d => xScale(d.data.rank)+30)
            .attr('y', d => yScale(d[1]))
            .attr('height', d => yScale(d[0]) - yScale(d[1]))
            .transition()
            .duration(500)
            .attr('width', xScale.bandwidth());

    // `sort-by-selector`: re-plot based on change of the `sort-by-select` selector
    const sortSelect = d3.select('#sort-by-select');
    const sortOptions = ['overall', 'teaching', 'research', 'citations', 'industry_income', 'international_outlook'];
    
    sortSelect.selectAll('option')
        .data(sortOptions)
        .enter()
        .append('option')
        .text(d => d)
        .attr('value', d => d);

    sortSelect.on('change', function() {
            const selectedFeature = 'scores_' + this.value;

            // Sort the data based on selected option
            data.sort((a, b) => b[selectedFeature] - a[selectedFeature]);

            // Update the order of data stacks
            subgroups = [selectedFeature, ...subgroups.filter(item => item !== selectedFeature)];

            // Update the stacked data
            const updatedStackedData = d3.stack()
                .keys(subgroups)
                (data);

            // Update charts
            svg.selectAll('rect').remove();

            svg.append('g')
                .selectAll('g')
                .data(updatedStackedData)
                .join('g')
                .attr('fill', d => colorScale(d.key))
                .selectAll('rect')
                    .data(d => d)
                    .join('rect')
                    .attr('x', d => xScale(d.data.rank)+30)
                    .attr('y', d => yScale(d[1]))
                    .attr('height', d => yScale(d[0]) - yScale(d[1]))
                    .transition()
                    .duration(500)
                    .attr('width', xScale.bandwidth());
            
            // Call tooltip function 
            tooltip();
        });
    
    // Add axis names at left side and bottom side
    // Left side
    svg.selectAll('.column-label-left')
        .data(['Cumulative Score'])
        .enter().append('text')
        .text(d => d)
        .style('font-size', 14)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(-5, ${height*0.37}) rotate(-90)`)
        .attr('class', 'column-label-left');
    
    // Bottom side
    svg.selectAll('.column-label-bottom')
        .data(['Rank'])
        .enter().append('text')
        .text(d => d)
        .style('font-size', 14)
        .attr('text-anchor', 'middle')
        .attr('transform', `translate(${width/2+50}, ${height+40})`)
        .attr('class', 'column-label-bottom');
    
    // TODO:
    // Tooltip
    // Add event listeners to show/hide the tooltip
    function tooltip() {
        const classLabel = d3.select('#class-label')
        svg.selectAll('rect')
            .on('mouseover', function(event, d) {
                // Highlight the point by changing its fill color
                // Stacked bar charts
                d3.selectAll('rect')
                    .filter(data => data === d)
                    .style('stroke', 'red')
                    .style('stroke-width', '2px');

                // Show the values
                classLabel.text(`${d.data.name}`);
            })
            .on('mouseout', function(event, d) {
                // Change it back to the class-based color
                // Stacked bar charts
                d3.selectAll('rect')
                    .filter(data => data === d)
                    .style('stroke', 'none');

                // Hide the values
                classLabel.text('');
            });
    };
    // Call tooltip function 
    tooltip();
}; 