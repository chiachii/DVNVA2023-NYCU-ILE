// Load the dataset
d3.csv('../data/spotify.csv').then(data => {
    // EventListener for `search-bar`
    document.getElementById('sb-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            // Update the `inputValue`  
            var inputValue = event.target.value;
            // console.log('Input Value: ' + inputValue);
            popularity_svg.selectAll('g').remove();
            popularity_svg.selectAll('rect').remove();
            popularity_svg.selectAll('text').remove();
            if (inputValue.trim() !== '') {
                render_popularity(data.filter(d => d.artist === inputValue));
            } else {
                render_popularity(data);
            };
        };
    });
    
    // Initialization
    // console.log(data);
    render_popularity(data);
});

// Build the Histogram
// Define the SVG dimensions and margins 
const popularity_margin = { top: 20, right: 10, bottom: 40, left: 50};
const popularity_width = 650 - popularity_margin.left - popularity_margin.right;
const popularity_height = 300 - popularity_margin.top - popularity_margin.bottom;

// Create the SVG container
const popularity_svg = d3.select('#hist-v-popularity')
    .append('svg')
    .attr('width', 650)
    .attr('height', 300)
    .append('g')
    .attr('transform', `translate(${popularity_margin.left}, ${popularity_margin.top})`);

// Render Function: to draw a bar chart for 'popularity' vs. 'songs number'
const render_popularity = (data) => {
    // X-axis: scale and draw
    var xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, popularity_width]);
    popularity_svg.append('g')
        .attr('transform', 'translate(0,' + popularity_height + ')')
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
        .range([popularity_height, 0]);
    popularity_svg.append('g')
        .call(d3.axisLeft(yScale));

    // Add axis name at left and bottom sides
    popularity_svg.selectAll('.y-axis-name') // Left side
        .data(['Counts'])
        .enter().append('text')
        .text(d => d)
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(0, -8)`)
        .attr('class', 'axis-name');
    popularity_svg.selectAll('.x-axis-name') // Bottom side
        .data(['Popularity'])
        .enter().append('text')
        .text(d => d)
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(${(popularity_width+40)/2}, ${popularity_height+35})`)
        .attr('class', 'axis-name');

    // Create a color scale for popularitys
    const colorScale = d3.scaleOrdinal()
        .domain(Array.from(new Set(bins.map(d => d.x0))))
        .range(["#e8f6f9","#d5efed","#b7e4da","#8fd3c1","#68c2a3","#49b17f","#2f9959","#157f3c","#036429","#00441b"]);

    // Create bar chart
    popularity_svg.selectAll('rect')
        .data(bins)
        .join('rect')
            .attr('x', 6)
        .attr('transform', d => `translate(${xScale(d.x0)}, ${yScale(d.length)})`)
        .attr('width', d => 0.8*(xScale(d.x1) - xScale(d.x0)))
        .attr('height', d => d.length > 0 ? popularity_height - yScale(d.length) : 0)
        .attr('fill', d => colorScale(d.x0));
    
    // Add value label on the top of each rect
    popularity_svg.selectAll('.valueLabel')
        .data(bins)
        .enter().append('text')
        .text(d => d.length)
        .attr('font-size', 10)
        .attr('text-anchor', 'middle')
        .attr('fill', d => colorScale(d.x0))
        .attr('transform', d => `translate(${xScale(d.x0) + (xScale(d.x1) - xScale(d.x0))/2}, ${yScale(d.length) - 5})`);
};