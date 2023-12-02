// Load the dataset
d3.csv('../data/spotify.csv').then(data => {
    // EventListener for `search-bar`
    document.getElementById('sb-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            // Update the `inputValue`  
            var inputValue = event.target.value;
            // console.log('Input Value: ' + inputValue);
            svg.selectAll('g').remove();
            svg.selectAll('rect').remove();
            svg.selectAll('text').remove();
            if (inputValue.trim() !== '') {
                render_hist_popularity(data.filter(d => d.artist === inputValue));
            } else {
                render_hist_popularity(data);
            };
        };
    });
    
    // Initialization
    // console.log(data);
    render_hist_popularity(data);
});

// Build the Histogram
// Define the SVG dimensions and margins 
const margin = { top: 20, right: 10, bottom: 40, left: 50};
const width = 650 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select('#hist-v-popularity')
    .append('svg')
    .attr('width', 650)
    .attr('height', 300)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// Render Function: to draw a bar chart for 'popularity' vs. 'songs number'
const render_hist_popularity = (data) => {
    // X-axis: scale and draw
    var xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);
    svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(xScale));

    // Set the parameters for the histogram
    var histogram = d3.histogram()
        .value(d => d.popularity)
        .domain(xScale.domain())
        .thresholds(xScale.ticks(10)); // the number of bins
    // Apply this function to data to get the bins
    var bins = histogram(data);

    // Y-axis: scale and draw
    var yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([height, 0]);
    svg.append('g')
        .call(d3.axisLeft(yScale));

    // Add axis name at left and bottom sides
    svg.selectAll('.y-axis-name') // Left side
        .data(['Counts'])
        .enter().append('text')
        .text(d => d)
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(0, -8)`)
        .attr('class', 'axis-name');
    svg.selectAll('.x-axis-name') // Bottom side
        .data(['Popularity'])
        .enter().append('text')
        .text(d => d)
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(${(width+40)/2}, ${height+35})`)
        .attr('class', 'axis-name');

    // Create a color scale for popularitys
    const colorScale = d3.scaleOrdinal()
        .domain(Array.from(new Set(bins.map(d => d.x0))))
        .range(["#fff0a9","#fee087","#fec965","#feab4b","#fd893c","#fa5c2e","#ec3023","#d31121","#af0225","#800026"]);

    // Create bar chart
    svg.selectAll('rect')
        .data(bins)
        .join('rect')
            .attr('x', 6)
        .attr('transform', d => `translate(${xScale(d.x0)}, ${yScale(d.length)})`)
        .attr('width', d => 0.8*(xScale(d.x1) - xScale(d.x0)))
        .attr('height', d => d.length > 0 ? height - yScale(d.length) : 0)
        .attr('fill', d => colorScale(d.x0));
};