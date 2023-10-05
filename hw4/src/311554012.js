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
    const columns = data.columns.slice(0, 4);

    // Create color scale
    const species = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'];
    const colorScale = d3.scaleOrdinal()
        .domain(species)
        .range(d3.schemeCategory10)

    // Create a scale: gives the position of each pair each featureiable
    const position = d3.scalePoint()
        .domain(columns)
        .range([0, width]);
    
    // Functions for plotting scatter plots and histograms
    function addHistogram(feature1, feature2) {
        // create X Scale
        xExtent = d3.extent(data, function(d) { return +d[feature1] })
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
            .value(d => +d[feature1])   // I need to give the vector of value
            .domain(xScale.domain())  // then the domain of the graphic
            .thresholds(xScale.ticks(20)); // then the numbers of bins

        // And apply this function to data to get the bins
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
                .attr('x', 1)
                .attr('transform', d => `translate(${xScale(d.x0)}, ${yScale(d.length)})`)
                .attr('width', d => xScale(d.x1) - xScale(d.x0))
                .attr('height', d => (width/4+15) - yScale(d.length))
                .style('fill', '#b8b8b8')
                .attr('stroke', 'white')
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
            .attr('cx', d => xScale(+d[feature1]))
            .attr('cy', d => yScale(+d[feature2]))
            .attr('r', 3)
            .attr('fill', d => colorScale(d.class));
    };

    // Add charts
    for (i in columns) {
        for (j in columns) {
            // Get current featureiable name
            let feature1 = columns[i]
            let feature2 = columns[j]
            
            // Add histogram: if index is same, i.e. `i==j` (diagonal)
            if (feature1 === feature2) { 
                addHistogram(feature1, feature2); 
            } else {
                addScatterPlot(feature1, feature2); 
            };

            // Add feature names at left side and bottom side
            
        };
    };

}; 