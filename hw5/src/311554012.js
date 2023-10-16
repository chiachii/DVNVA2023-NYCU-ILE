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

        // Reset the value of `sort-by-select`
        d3.select('#sort-by-select').property('value', 'overall');

        // Update charts
        svg.selectAll('g').remove();
        render(data, order, amount);
    });

    // `order-selector`: re-plot based on change of the `order-select` selector
    d3.select('#order-select').on('change', function() {
        order = this.value; 

        // Reset the value of `sort-by-select`
        d3.select('#sort-by-select').property('value', 'overall');
        
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
            d['rank'] = d['rank'].replace('=', '');
        }
    });
    data = data.filter(d => !isNaN(d['rank'])).slice(0, +amount);
    // console.log(data);

    // Add X axis
    if (order === 'ascending') {
        var xValue = Object.keys(groups).map(key => parseInt(key) + 1).toReversed();
    } else {
        var xValue = Object.keys(groups).map(key => parseInt(key) + 1);
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
            .attr('x', (d, i) => xScale(i+1)+30)
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
                    .attr('x', (d, i) => xScale(i+1)+30)
                    .attr('y', d => yScale(d[1]))
                    .attr('height', d => yScale(d[0]) - yScale(d[1]))
                    .transition()
                    .duration(500)
                    .attr('width', xScale.bandwidth());
            
            // Call tooltip function 
            tooltip_function();
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
        .data(['Index'])
        .enter().append('text')
        .text(d => d)
        .style('font-size', 14)
        .attr('text-anchor', 'middle')
        .attr('transform', `translate(${width/2+50}, ${height+40})`)
        .attr('class', 'column-label-bottom');
    
    // Tooltip
    // Add event listeners to show/hide the tooltip
    function tooltip_function() {
        // Create a tooltip
        const tooltip = d3.select('#tooltip')
            .style('position', 'absolute')
            .style('background-color', 'white')
            .style('border', '1px solid #ddd')
            .style('border-radius', '4px')
            .style('padding', '10px')
            .style('display', 'none')
            .style('font-size', '0.85rem');

        const classLabel = d3.select('#class-label')
        svg.selectAll('rect')
            .on('mouseover', function(event, d) {
                // Highlight
                d3.selectAll('rect')
                    .filter(data => data.data.name === d.data.name)
                    .style('stroke', '#fc330f')
                    .style('stroke-width', '1.5px');
                    
                // Show the values
                classLabel.text(`${d.data.name}`);
                // Show the tooltip
                tooltip.style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 25) + 'px')
                    .style('display', 'block')
                    .html(`
                        <strong> Rank: </strong> ${d.data.rank} <br>
                        <span style="color:#a9a9a9"> detail score (ranking) </span>
                        <hr />
                        <span>
                            <i class="fa fa-square" style="color:#9ac8eb"></i> : ${d.data.scores_overall} (${d.data.scores_overall_rank})
                        </span> <br>
                        <span>
                            <i class="fa fa-square" style="color:#d9a7c7"></i> : ${d.data.scores_teaching} (${d.data.scores_teaching_rank})
                        </span> <br>
                        <span>
                            <i class="fa fa-square" style="color:#81C784"></i> : ${d.data.scores_research} (${d.data.scores_research_rank})
                        </span> <br>
                        <span>
                            <i class="fa fa-square" style="color:#f3c7d5"></i> : ${d.data.scores_citations} (${d.data.scores_citations_rank})
                        </span> <br>
                        <span>
                            <i class="fa fa-square" style="color:#90A4AE"></i> : ${d.data.scores_industry_income} (${d.data.scores_industry_income_rank})
                        </span> <br>
                        <span>
                            <i class="fa fa-square" style="color:#f9c995"></i> : ${d.data.scores_international_outlook} (${d.data.scores_international_outlook_rank})
                        </span>
                    `);
            })
            .on('mouseout', function(event, d) {
                // Change it back
                d3.selectAll('rect')
                    .filter(data => data.data.name === d.data.name)
                    .style('stroke', 'none');

                // Hide the values
                classLabel.text('');
                // Hide the tooltip
                tooltip.style('display', 'none');
            });
    };
    // Call tooltip function 
    tooltip_function();
}; 