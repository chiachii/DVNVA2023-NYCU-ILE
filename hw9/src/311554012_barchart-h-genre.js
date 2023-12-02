// Load the dataset
d3.csv('../data/spotify.csv').then(data => {
    // Define the `genreCounts`: for recording in `render_bc_genre()`,
    // and `genreLabels`: all of class of `data.track_genre`
    const genreCounts = {};
    const genreLabels = Array.from(new Set(data.map(d => d.track_genre)));
    genreLabels.forEach(d => {
        if (!genreCounts[d]) {
            genreCounts[d] = 0;
        };
    });
    // console.log(genreCounts);

    // EventListener for `search-bar`
    document.getElementById('sb-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            // Update the `inputValue`  
            var inputValue = event.target.value;
            // Remove previous graph
            svg.selectAll('g').remove();
            svg.selectAll('rect').remove();
            svg.selectAll('text').remove();
            // Return `genreCounts` to Zero
            const genreCounts = {};
            const genreLabels = Array.from(new Set(data.map(d => d.track_genre)));
            genreLabels.forEach(d => {
                if (!genreCounts[d]) {
                    genreCounts[d] = 0;
                };
            });
            // Update the graph
            if (inputValue.trim() !== '') {
                render_bc_genre(data.filter(d => d.artist === inputValue), genreCounts);
            } else {
                render_bc_genre(data, genreCounts);
            };
        };
    });
    
    // Initialization
    // console.log(data);
    render_bc_genre(data, genreCounts);
});

// Build the Bar Chart
// Define the SVG dimensions and margins 
const margin = { top: 20, right: 10, bottom: 40, left: 50};
const width = 1250 - margin.left - margin.right;
const height = 3000 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select('#barchart-h-genre')
    .append('svg')
    .attr('width', 1300)
    .attr('height', 3000)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// Render Function: to draw a bar chart for 'genre' vs. 'songs number'
const render_bc_genre = (data, genreCounts) => {
    // Counting for corresponding 'genre' from data
    data.forEach(d => {
        genreCounts[d.track_genre]++;
    });
    // Sorting by value
    const sortedEntries = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
    var genre = Object.fromEntries(sortedEntries);
    // console.log(genre)

    // X-axis: scale and draw
    var countsArray = Object.values(genre);
    var maxCount = Math.max(...countsArray);
    var xScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([0, width]);
    svg.append('g')
        .attr('transform', 'translate(50, 20)')
        .call(d3.axisTop(xScale));

    // Y-axis: scale and draw
    var yScale = d3.scaleBand()
        .domain(Object.keys(genre))
        .range([0, height])
        .padding(0.2);
    svg.append('g')
        .attr('transform', 'translate(50, 20)')
        .call(d3.axisLeft(yScale));

    // Add axis name at left and top sides
    svg.selectAll('.y-axis-name') // Left side
        .data(['Genre'])
        .enter().append('text')
        .text(d => d)
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(15, -8)`)
        .attr('class', 'axis-name');
    svg.selectAll('.x-axis-name') // Top side
        .data(['Counts'])
        .enter().append('text')
        .text(d => d)
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(${(width+100)/2}, -8)`)
        .attr('class', 'axis-name');

    // Create a color scale for genres
    const colorScale = d3.scaleOrdinal()
        .domain(Object.keys(genre))
        .range(d3.quantize(d3.interpolateGnBu, 114).reverse());
    console.log()
    // Create bar chart
    svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', xScale(0)+50)
        .attr('y', d => yScale(d.track_genre)+20)
        .attr('width', d => xScale(genre[d.track_genre]))
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.track_genre));
};