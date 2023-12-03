// Load the dataset
d3.csv('../data/spotify.csv').then(data => {
    // EventListener for `search-bar`
    document.getElementById('sb-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            // Update the `inputValue`  
            var inputValue = event.target.value;
            // Remove previous graph
            radar_svg.selectAll('g').remove();
            radar_svg.selectAll('.gridCircle').remove();
            // Update the graph
            if (inputValue.trim() !== '') {
                render_radar(data.filter(d => d.artist === inputValue));
            } else {
                render_radar(data);
            };
        };
    });
    
    // Initialization
    // console.log(data);
    render_radar(data);
});

// Build the Radar chart
// Define the SVG dimensions and margins 
const radar_margin = { top: 20, right: 10, bottom: 40, left: 50};
const radar_width = 350 - radar_margin.left - radar_margin.right;
const radar_height = 280 - radar_margin.top - radar_margin.bottom;

// Create the SVG container
const radar_svg = d3.select('#radar')
    .append('svg')
    .attr('width', 350)
    .attr('height', 300)
    .append('g')
    .attr('transform', `translate(${radar_width/2 + 30}, ${radar_height/2 + 40})`);

// Render Function: to draw a bar chart for 'popularity' vs. 'songs name'
const render_radar = (data) => {
    // Extract the mean value of each metrics
    const metrics = ['danceability', 'energy', 'mode', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence'];
    const radarData = metrics.map(metric => {
        const values = data.map(d => +d[metric]);
        const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
        return { axis: metric, value: +mean.toFixed(4) };
    });
    // console.log([radarData]);
    
    // Initialize for radar chart
    var allAxis = (radarData.map(function(i, j){return i.axis})),	// Names of each axis
		total = allAxis.length,					// The number of different axes
		radius = Math.min(radar_width/2, radar_height/2), 	// Radius of the outermost circle
		angleSlice = Math.PI * 2 / total;		// The width in radians of each 'slice'

	// Scale for the radius
	var rScale = d3.scaleLinear()
		.range([0, radius])
		.domain([0, 1]);
    
    // Draw the background circles
	radar_svg.selectAll('.levels')
        .data(d3.range(1, 6).reverse())
        .enter()
        .append('circle')
        .attr('class', 'gridCircle')
        .attr('r', d => radius/5*d)
        .style('fill', '#CDCDCD')
        .style('stroke', '#CDCDCD')
        .style('fill-opacity', 0.1)
        .style('filter' , 'url(#glow)');

    // Text indicating at what % each level is
	radar_svg.selectAll('.axisLabel')
        .data(d3.range(1, 6).reverse())
        .enter().append('text')
        .attr('class', 'axisLabel')
        .attr('x', 4)
        .attr('y', d => -d*radius/5)
        .attr('dy', '0.4em')
        .style('font-size', '10px')
        .attr('fill', '#737373')
        .text(d => (d/5).toFixed(1));
    
    // Draw the axis
    // Create the straight lines radiating outward from the center
	var axis = radar_svg.selectAll('.axis')
            .data(allAxis)
            .enter()
            .append('g')
            .attr('class', 'axis');
        axis.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', (d, i) => rScale(1.1) * Math.cos(angleSlice*i - Math.PI/2))
            .attr('y2', (d, i) => rScale(1.1) * Math.sin(angleSlice*i - Math.PI/2))
            .attr('class', 'line')
            .style('stroke', '#333333')
            .style('stroke-opacity', 0.3)
            .style('stroke-width', '1px');
        // Append the labels at each axis
        axis.append('text')
            .attr('class', 'legend')
            .style('font-size', '11px')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('x', (d, i) => rScale(1.25) * Math.cos(angleSlice*i - Math.PI/2))
            .attr('y', (d, i) => rScale(1.25) * Math.sin(angleSlice*i - Math.PI/2))
            .text(d => d);
    
    // Draw the radar chart blob
    // The radial line function
	var radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);
    // Create a wrapper for the blobs	
	var blobWrapper = radar_svg.selectAll('.radarWrapper')
        .data([radarData])
        .enter().append('g')
        .attr('class', 'radarWrapper');
        // Append the backgrounds	
        blobWrapper.append('path')
            .attr('class', 'radarArea')
            .attr('d', d => radarLine(d))
            .style('fill', '#6e40aa')
            .style('fill-opacity', 0.35)
            .on('mouseover', function(d, i) {
                // Dim all blobs
                d3.selectAll('.radarCircle')
                    .style('fill-opacity', 0.1);
                
                // Append a text label with the value
                blobWrapper.selectAll('.radarValue')
                    .data(radarData)
                    .enter().append('text')
                    .attr('class', 'radarValue')
                    .attr('x', (d, i) => i < 4 ? rScale(d.value+0.2) * Math.cos(angleSlice*i - Math.PI/2) : rScale(d.value+0.2) * Math.cos(angleSlice*i - Math.PI/2) - 5)
                    .attr('y', (d, i) => i < 2 ? rScale(d.value+0.2) * Math.sin(angleSlice*i - Math.PI/2) + 10 : rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2) + 10) // Adjust the y position for better visibility
                    .text(d => d.value.toFixed(2))
                    .style('font-size', '11px')
                    .attr('text-anchor', 'middle')
                    .attr('dy', '0.35em')
                    .style('fill', '#6e40aa');
            })
            .on('mouseout', function() {
                // Bring back all blobs
                d3.selectAll('.radarCircle')
                    .style('fill-opacity', 0.8);

                // Bring back all value labels   
                d3.selectAll('.radarValue').remove();
            });
        // Create the outlines	
        blobWrapper.append('path')
            .attr('class', 'radarStroke')
            .attr('d', d => radarLine(d))
            .style('stroke-width', '2px')
            .style('stroke', '#6e40aa')
            .style('fill', 'none')
            .style('filter' , 'url(#glow)');
        // Append the circles
        blobWrapper.selectAll('.radarCircle')
            .data(radarData)
            .enter().append('circle')
            .attr('class', 'radarCircle')
            .attr('r', 4)
            .attr('cx', (d, i) => rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2))
            .attr('cy', (d, i) => rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2))
            .style('fill', '#6e40aa')
            .style('fill-opacity', 0.8);
};