// Load the dataset
d3.csv('../data/iris.csv').then(data => {
    // Preprocess the data type
    data.forEach(d => {
        d['petal length'] = +d['petal length'];
        d['petal width'] = +d['petal width'];
        d['sepal length'] = +d['sepal length'];
        d['sepal width'] = +d['sepal width'];
    });

    // Scatter Plot
    render(data);
});

// Scatter Plot Matrix
// Define the SVG dimensions and margins 
const margin = { top: 20, right: 20, bottom: 20, left: 20};
const width = 640 - margin.left - margin.right;
const height = 640 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select('#scatter-plot-matrix')
    .append('svg')
    .attr('width', 850)
    .attr('height', 850)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// Render Function
const render = data => {
    // Extract the feature names
    const columns = ['petal length', 'petal width', 'sepal length', 'sepal width'];

    // Create color scale
    const species = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'];
    const colorScale = d3.scaleOrdinal()
        .domain(species)
        .range(['#6495ED', '#20B2AA', '#9370DB'])

    // Create a scale: gives the position of each pair each featureiable
    const position = d3.scalePoint()
        .domain(columns)
        .range([0, width]);
    
    // Functions for plotting scatter plots and histograms
    function addHistogram(feature1, feature2) {
        // Create X Scale
        xExtent = d3.extent(data, d => +d[feature1])
        const xScale = d3.scaleLinear()
            .domain(xExtent).nice()
            .range([0, width/4+15]);

        // Add a 'g' at the right position
        const tmp = svg
            .append('g')
            .attr('transform', `translate(${position(feature1)+20}, ${position(feature2)+20})`);

        // Add X axis
        tmp.append('g')
            .attr('transform', `translate(0, ${width/4+15})`)
            .call(d3.axisBottom(xScale).ticks(3));

        // set the parameters for the histogram
        const histogram = d3.histogram()
            .value(d => +d[feature1])   // give the vector of value
            .domain(xScale.domain())  // domain of the graphic
            .thresholds(xScale.ticks(20)); // numbers of bins

        // Apply this function to data to get the bins
        const bins = histogram(data);

        // Y axis: scale and draw:
        const yScale = d3.scaleLinear()
                .range([width/4+15, 0])
                .domain([0, d3.max(bins, d => d.length)]);   // d3.hist has to be called before the Y axis obviously

        // Append the bar rectangles to the svg element
        tmp.append('g')
            .selectAll('rect')
            .data(bins)
            .join('rect')
                .attr('class', 'data-bar')
                .attr('x', 1)
                .attr('transform', d => `translate(${xScale(d.x0)}, ${yScale(d.length)})`)
                .attr('width', d => xScale(d.x1) - xScale(d.x0))
                .attr('height', d => (width/4+15) - yScale(d.length))
                .style('fill', '#b8b8b8')
                .attr('stroke', 'white')
                .attr('data-column', feature1)
    };

    function addScatterPlot(feature1, feature2) {
        // Add X Scale of each graph
        xExtent = d3.extent(data, d => +d[feature1])
        const xScale = d3.scaleLinear()
            .domain(xExtent).nice()
            .range([0, width/4+15]);

        // Add Y Scale of each graph
        yExtent = d3.extent(data, d => +d[feature2])
        const yScale = d3.scaleLinear()
            .domain(yExtent).nice()
            .range([width/4+15, 0]);

        // Add a 'g' at the right position
        const tmp = svg.append('g')
            .attr('transform', `translate(${position(feature1)+20}, ${position(feature2)+20})`);

        // Add X and Y axis in tmp
        tmp.append('g')
            .attr('transform', `translate(0, ${width/4+15})`)
            .call(d3.axisBottom(xScale).ticks(3));
        tmp.append('g')
            .call(d3.axisLeft(yScale).ticks(3));

        // Add circle
        tmp.selectAll('circles')
            .data(data)
            .join('circle')
                .attr('class', 'data-point')
                .attr('cx', d => xScale(+d[feature1]))
                .attr('cy', d => yScale(+d[feature2]))
                .attr('r', 3.5)
                .attr('fill', d => colorScale(d.class));
    };

    // Add charts
    for (i in columns) {
        for (j in columns) {
            // Get current feature name
            let feature1 = columns[i]
            let feature2 = columns[j]

            // Add histogram: if index is same, i.e. `i==j` (diagonal)
            if (feature1 === feature2) { 
                addHistogram(feature1, feature2); 
            } else {
                addScatterPlot(feature1, feature2); 
            };

            // Add feature names at left side and bottom side
            // Left side
            svg.selectAll('.column-label-left')
                .data(columns)
                .enter().append('text')
                .text(d => d)
                .attr('x', d => position(d)-680)
                .style('font-size', 14)
                .attr('text-anchor', 'end')
                .attr('transform', `translate(-15, ${height+220}) rotate(90)`)
                .attr('class', 'column-label-left');
            
            // Bottom side
            svg.selectAll('.column-label-bottom')
                .data(columns)
                .enter().append('text')
                .text(d => d)
                .attr('x', d => position(d)+105)
                .style('font-size', 14)
                .attr('text-anchor', 'middle')
                .attr('transform', `translate(0, ${height+220})`)
                .attr('class', 'column-label-bottom');
        };
    };
    
    // Select the label elements where you want to display the selected values
    const classLabel = d3.select('#class-label')
    const plLabel = d3.select('#pl-label');
    const pwLabel = d3.select('#pw-label');
    const slLabel = d3.select('#sl-label');
    const swLabel = d3.select('#sw-label');

    // Add event listeners to show/hide the tooltip
    // (1) Scatter Plot to Histogram
    svg.selectAll('.data-point')
        .on('mouseover', function(event, d) {
            // Highlight the point by changing its fill color
            // Scatter plot
            d3.selectAll('.data-point')
                .filter(data => data === d)
                .style('fill', '#FFA500');

            // Histogram
            for (i in columns) {
                // Create X Scale
                xExtent = d3.extent(data, d => +d[columns[i]])
                const xScale = d3.scaleLinear()
                    .domain(xExtent).nice()
                    .range([0, width/4+15]);

                // Get bins
                const histogram = d3.histogram()
                    .value(d => +d[columns[i]])
                    .domain(xScale.domain()) 
                    .thresholds(xScale.ticks(20));
                const bins = histogram(data);
                // console.log('bins=',bins) // for debug

                // Highlight the corresponding bins
                bins.forEach(b => {
                    if (d[columns[i]] >= b.x0 && d[columns[i]] < b.x1) {
                        // console.log('b=',b) // for debug
                        d3.selectAll(`rect[data-column='${columns[i]}']`)
                            .filter(bins => bins.x0 === b.x0 && bins.x1 === b.x1)
                            .style('fill', '#FFA500');
                    };
                });
            };

            // Show the values
            classLabel.text(`${d['class']}`).style('color', colorScale(d['class']));
            plLabel.text(`${d['petal length']}`).style('color', colorScale(d['class']));
            pwLabel.text(`${d['petal width']}`).style('color', colorScale(d['class']));
            slLabel.text(`${d['sepal length']}`).style('color', colorScale(d['class']));
            swLabel.text(`${d['sepal width']}`).style('color', colorScale(d['class']));
        })
        .on('mouseout', function(event, d) {
            // Change it back to the class-based color
            // Scatter plot
            d3.selectAll('.data-point')
                .filter(data => data === d)
                .style('fill', d => colorScale(d.class));

            // Histogram
            d3.selectAll('rect')
                .style('fill', '#b8b8b8');

            // Hide the values
            classLabel.text('');
            plLabel.text('');
            pwLabel.text('');
            slLabel.text('');
            swLabel.text('');
        });

    // (2) Histogram to Scatter Plot
    svg.selectAll('.data-bar')
        .on('mouseover', function(event, d) {
            // Highlight the point by changing its fill color
            // Scatter plot
            d.forEach(d => {
                d3.selectAll('.data-point')
                    .filter(data => data === d)
                    .style('fill', '#FFA500');
            });

            // Histogram
            d3.selectAll('.data-bar')
                .filter(data => data === d)
                .style('fill', '#FFA500');
        })
        .on('mouseout', function(event, d) {
            // Change it back to the class-based color
            // Scatter plot
            d.forEach(d => {
                d3.selectAll('.data-point')
                    .filter(data => data === d)
                    .style('fill', colorScale(d.class));
            });

            // Histogram
            d3.selectAll('rect')
                .style('fill', '#b8b8b8');
        });
}; 