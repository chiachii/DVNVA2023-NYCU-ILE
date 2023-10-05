// Load the dataset
d3.text('../data/abalone.data').then(text => {
    // Define the column names
    const columns = ['Sex', 'Length', 'Diameter', 'Height', 'Whole weight', 'Shucked weight', 'Viscera weight', 'Shell weight', 'Rings'];
   
    // Preprocess the dataset    
    const data = d3.csvParseRows(text, (row, i) => {
        // Use the defined column names to create an object
        const rowData = {};
        columns.forEach((col, j) => {
            rowData[col] = j === 0 ? row[j] : +row[j]; // Convert numeric values to numbers
        });
        return rowData;
    });
    data.columns = columns;

    // Controller Function
    controller(data);

    // Correlation Matrix
    render(data);
});

// Controller Function
const attributions = ['M', 'F', 'I'];
const controller = () => {
    // Generate unique IDs for each category
    attributions.forEach(category => {
        // Selector dropdown
        d3.select(`#sex-select-${category}`)
            .selectAll('option')
            .data(attributions)
            .enter()
            .append('option')
            .text(d => d)
            .attr('value', d => d);
    });
};

// Correlation Matrix
// Define the SVG dimensions and margins 
const margin = { top: 65, right: 160, bottom: 65, left: 90};
const width = 620 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.selectAll('#correlation-matrix')
    .append('svg')
    .attr('width', 615)
    .attr('height', 560)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// Create a color scale
const colorScale = d3.scaleLinear()
        .domain([-1, 0, 1])
        .range(['#cfb83a', '#fff', '#000080']);

// Create a size scale for bubbles on top right.
const size = d3.scaleSqrt()
        .domain([0, 1])
        .range([0, 9]);

// Render Function
const render = data => {
    // Define the features
    const features = data.columns.slice(1);
    // Create scales for X and Y axes
    const xScale = d3.scalePoint()
        .domain(features)
        .range([0, width]);

    const yScale = d3.scalePoint()
        .domain(features)
        .range([0, height]);

    // Define the categories
    const categories = ['M', 'F', 'I'];

    // Function to calculate the correlation matrix for a specific category
    function calculateCorrelationMatrix(category) {
        const categoryData = data.filter(d => d.Sex === category);
        const correlationMatrix = {};

        // Compute correlations for each pair of attributes
        features.forEach(feature1 => {
            correlationMatrix[feature1] = {};
            features.forEach(feature2 => {
                const x = categoryData.map(d => d[feature1]); // Get the first specified feature
                const y = categoryData.map(d => d[feature2]); // Get the specified second feature
                const correlation = calculateCorrelation(x, y);
                correlationMatrix[feature1][feature2] = correlation;
            });
        });
        return correlationMatrix;
    }

    // Function to calculate the correlation between two arrays
    function calculateCorrelation(x, y) {
        const n = x.length;
        if (n === 0) return NaN;

        const sumX = x.reduce((acc, val) => acc + val, 0);
        const sumY = y.reduce((acc, val) => acc + val, 0);
        const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
        const sumY2 = y.reduce((acc, val) => acc + val * val, 0);
        const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? NaN : numerator / denominator;
    };

    // Calculate correlation matrices for each category
    const correlationMatrices = {};
    categories.forEach(category => {
        correlationMatrices[category] = calculateCorrelationMatrix(category);
    });
    // console.log(correlationMatrices); // For check

    // Modify the data to match the format expected by the new visualization
    const corData = [];
    features.forEach(feature1 => {
        features.forEach(feature2 => {
            categories.forEach(category => {
                corData.push({
                    x: feature1,
                    y: feature2,
                    category: category,
                    value: correlationMatrices[category][feature1][feature2],
                });
            });
        });
    });

    // Function to create the correlation matrix visualization
    const plotCorrelationMatrix = (category) => {
        // Create the 'g' elements for each cell of the correlogram
        const cor = svg.selectAll('.cor')
            .data(corData.filter(d => d.category == category))
            .enter()
            .append('g')
            .attr('class', 'cor')
            .attr('transform', d => `translate(${xScale(d.x)}, ${yScale(d.y)})`);
        
        cor.append('rect')
            .attr('width', width / 7)
            .attr('height', height / 7)
            .attr('x', -width / 14 + 30)
            .attr('y', -height / 14);

        // Low left part + Diagonal: Add the text with specific color
        cor.filter(d => features.indexOf(d.y) >= features.indexOf(d.x))
            .append('text')
            .transition().duration(500)
            .attr('x', 30)
            .attr('y', 5)
            .text(d => {
                if (d.x === d.y) {
                    return d.value.toFixed(2);
                } else {
                    return d.value.toFixed(2);
                }
            })
            .style('font-size', 11)
            .style('text-align', 'center')
            .style('fill', d => {
                return colorScale(d.value);
            });

        // Up right part: add circles
        cor.filter(d => features.indexOf(d.y) < features.indexOf(d.x))
            .append('circle')
            .transition().duration(500)
            .attr('r', d => size(Math.abs(d.value*2.5)))
            .style('fill', d => {
                return colorScale(d.value);
            })
            .style('opacity', 0.8)
            .attr('transform', `translate(30, 0)`);
    };
    
    // Right side: color bar
    const aS = d3.scaleLinear()
        .range([-margin.top + 38, height + margin.bottom - 38])
        .domain([1, -1]);

    const yA = d3.axisRight()
        .scale(aS)
        .tickPadding(7);

    const aG = svg.append('g')
        .attr('class', 'y-axis')
        .call(yA)
        .attr('transform', `translate(${width + margin.right / 2}, 0)`);

    const iR = d3.range(-0.988, 1.01, 0.01);
    const h = height / iR.length + 1;
    iR.forEach(d => {
        aG.append('rect')
            .style('fill', colorScale(d))
            .style('stroke-width', 0)
            .attr('height', h)
            .attr('width', 12)
            .attr('x', -12)
            .attr('y', aS(d));
    });

    // Add feature names to X and Y axes
    svg.append('g')
        .selectAll('text')
        .data(features)
        .enter()
        .append('text')
        .attr('x', -5)
        .attr('y', d => yScale(d))
        .attr('dy', '0.32em')
        .style('text-anchor', 'end')
        .style('font-size', 12)
        .text(d => d);

    svg.append('g')
        .selectAll('text')
        .data(features)
        .enter()
        .append('text')
        .attr('y', d => yScale(d))
        .attr('dy', '0.32em')
        .style('text-anchor', 'end')
        .style('font-size', 12)
        .text(d => d)
        .attr('transform', `translate(30, ${height + 35}) rotate(-90)`);

    // Call the plotCorrelationMatrix function with your calculated correlation matrix
    attributions.forEach(category => {
        // Clear the existing visualizations for this category
        d3.select(`.matrix-${category}`).selectAll('.cor').remove();

        // Call plotCorrelationMatrix with the selected sex for this category
        plotCorrelationMatrix(category);
    });

    // Get the select element for this category
    const selectElement_M = document.getElementById('sex-select-M');
    const selectElement_F = document.getElementById('sex-select-F');
    const selectElement_I = document.getElementById('sex-select-I');
    // Initialize selectors
    selectElement_M.selectedIndex = 0;
    selectElement_F.selectedIndex = 1;
    selectElement_I.selectedIndex = 2;
    
    // Listen for changes to the select element
    selectElement_M.addEventListener('change', function () {
        // Get the selected value (sex)
        const selectedSex = selectElement_M.value;

        // Clear the existing visualizations for this category
        d3.select('.matrix-M').selectAll('.cor').remove();

        // Call plotCorrelationMatrix with the selected sex for this category
        plotCorrelationMatrix(selectedSex);
    });
    selectElement_F.addEventListener('change', function () {
        // Get the selected value (sex)
        const selectedSex = selectElement_F.value;

        // Clear the existing visualizations for this category
        d3.select('.matrix-F').selectAll('.cor').remove();

        // Call plotCorrelationMatrix with the selected sex for this category
        plotCorrelationMatrix(selectedSex);
    });
    selectElement_I.addEventListener('change', function () {
        // Get the selected value (sex)
        const selectedSex = selectElement_I.value;

        // Clear the existing visualizations for this category
        d3.select('.matrix-I').selectAll('.cor').remove();

        // Call plotCorrelationMatrix with the selected sex for this category
        plotCorrelationMatrix(selectedSex);
    });
};