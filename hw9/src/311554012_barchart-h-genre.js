// Load the dataset
d3.csv('../data/spotify.csv').then(data => {
    // Define the `genreCounts`: for recording in `render_genre()`,
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
            genre_svg.selectAll('g').remove();
            genre_svg.selectAll('rect').remove();
            genre_svg.selectAll('text').remove();
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
                render_genre(data.filter(d => d.artist === inputValue), genreCounts);
            } else {
                render_genre(data, genreCounts);
            };
        };
    });
    
    // Initialization
    // console.log(data);
    render_genre(data, genreCounts);
});

// Build the Bar Chart
// Define the SVG dimensions and margins 
const genre_margin = { top: 20, right: 10, bottom: 40, left: 50};
const genre_width = 1250 - genre_margin.left - genre_margin.right;
const genre_height = 3000 - genre_margin.top - genre_margin.bottom;

// Create the SVG container
const genre_svg = d3.select('#barchart-h-genre')
    .append('svg')
    .attr('width', 1300)
    .attr('height', 3000)
    .append('g')
    .attr('transform', `translate(${genre_margin.left}, ${genre_margin.top})`);

// Render Function: to draw a bar chart for 'genre' vs. 'songs number'
const render_genre = (data, genreCounts) => {
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
        .range([0, genre_width]);
    genre_svg.append('g')
        .attr('transform', 'translate(50, 20)')
        .call(d3.axisTop(xScale));

    // Y-axis: scale and draw
    var yScale = d3.scaleBand()
        .domain(Object.keys(genre))
        .range([0, genre_height])
        .padding(0.2);
    genre_svg.append('g')
        .attr('transform', 'translate(50, 20)')
        .call(d3.axisLeft(yScale));

    // Add axis name at left and top sides
    genre_svg.selectAll('.y-axis-name') // Left side
        .data(['Genre'])
        .enter().append('text')
        .text(d => d)
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(15, -8)`)
        .attr('class', 'axis-name');
    genre_svg.selectAll('.x-axis-name') // Top side
        .data(['Counts'])
        .enter().append('text')
        .text(d => d)
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(${(genre_width+100)/2}, -8)`)
        .attr('class', 'axis-name');

    // Create a color scale for genres
    const colorScale = d3.scaleOrdinal()
        .domain(Object.keys(genre))
        .range(d3.quantize(d3.interpolateGnBu, 114).reverse());
    const valueLabel_colorScale = d3.scaleOrdinal()
        .domain(Object.keys(genre))
        .range(d3.quantize(d3.interpolateGreys, 114));
    // Create bar chart
    genre_svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', xScale(0)+50)
        .attr('y', d => yScale(d.track_genre)+20)
        .attr('width', d => xScale(genre[d.track_genre]))
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.track_genre));
    
    // Add value label on the top of each rect
    genre_svg.selectAll('.valueLabel')
        .data(Object.keys(genre))
        .enter().append('text')
        .text(d => genre[d])
        .attr('font-size', 10)
        .attr('text-anchor', 'start')
        .attr('fill', d => valueLabel_colorScale(d))
        .attr('transform', d => `translate(${xScale(0)+55}, ${(yScale(d)+23) + yScale.bandwidth()/2})`);
};