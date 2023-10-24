// Load the dataset
d3.csv('../data/air-pollution.csv').then(data => {
    // Define the default (global) value: `pollution`
    var pollution = 'CO';

    // `pollution-selector`: re-plot based on change of the `pollution-select` selector
    const pollutionSelect = d3.select('#pollution-select');
    const pollutionOptions = Object(['CO', 'NO2', 'O3', 'PM2.5', 'PM10', 'SO2']);
    
    pollutionSelect.selectAll('option')
        .data(pollutionOptions)
        .enter()
        .append('option')
        .text(d => d)
        .attr('value', d => d);
    
    d3.select('#pollution-select').on('change', function() {
        pollution = this.value; // Global Scope

        // Update charts
        svg.selectAll('g').remove();
        render(data, pollution);
    });
    
    // Preprocessing
    data.forEach(d => {
        d['Address'] = d['Address'].replace(', Seoul, Republic of Korea', '');
        d['CO'] = +d['CO'];
        d['NO2'] = +d['NO2'];
        d['O3'] = +d['O3'];
        d['PM2.5'] = +d['PM2.5'];
        d['PM10'] = +d['PM10'];
        d['SO2'] = +d['SO2'];
    });
    // Sort the data by 'Address'
    data.sort((a, b) => a['Address'].split(',')[0] - b['Address'].split(',')[0]);

    // Initialization
    // console.log(data);
    render(data, pollution);
});
// Build the Horizon Chart
// Define the SVG dimensions and margins 
const margin = { top: 20, right: 20, bottom: 20, left: 20};
const width = 1200 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select('#horizon-chart')
    .append('svg')
    .attr('width', 1300)
    .attr('height', 700)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// Render Function
const render = (data, pollution) => {
    // Create `newData`: Group the data by 'Address' & Compute the mean value of each pollution by date
    const newData = [];
    data.forEach(d => {
        // Extract the `addrKey` and `dateKey`
        var addrKey = d['Address'];
        var dateKey = d['Measurement date'].slice(0, 10);

        // Create entries for each 'Address'
        if (!newData[addrKey]) {
            newData[addrKey] = {};
        };
        // If the date does not in the 'Address', then create one
        if (!newData[addrKey][dateKey]) {
            newData[addrKey][dateKey] = {
                'CO': 0, 'NO2': 0, 'O3': 0, 'PM2.5': 0, 'PM10': 0, 'SO2': 0
            };
        };

        // Accumulate the mean of pollution value
        newData[addrKey][dateKey]['CO'] += d['CO']/24;
        newData[addrKey][dateKey]['NO2'] += d['NO2']/24;
        newData[addrKey][dateKey]['O3'] += d['O3']/24;
        newData[addrKey][dateKey]['PM2.5'] += d['PM2.5']/24;
        newData[addrKey][dateKey]['PM10'] += d['PM10']/24;
        newData[addrKey][dateKey]['SO2'] += d['SO2']/24;
    });
    console.log(newData);

    // Create colorMapping
    const colorMapping = {
        'CO': '#9ac8eb',
        'NO2': '#d9a7c7',
        'O3': '#81C784',
        'PM2.5': '#f3c7d5',
        'PM10': '#90A4AE',
        'SO2': '#f9c995'
    };

    // Extract all of the 'Address'
    const addrs = Object.keys(newData);
    // Create horizon chart for each 'Address'
    addrs.forEach((addr, i) => {
        // Create a new SVG element for each 'Address'
        const addrSvg = svg.append('g')
            .attr('stroke', 'black')
            .attr('stroke-width', 0.1)
            .attr('class', 'addr-chart')
            .attr('transform', `translate(0, ${i * height/21})`);
    
        // Create xScale (time)
        const xScale = d3.scaleTime()
            .domain([new Date('2017-01-01'), new Date('2019-12-31')])
            .range([0, width]);

        // Create yScale (pollution)
        console.log([d3.min(Object.values(newData[addr]), d => d[pollution]), d3.max(Object.values(newData[addr]), d => d[pollution])])
        const yScale = d3.scaleLinear()
            .domain([d3.min(Object.values(newData[addr]), d => d[pollution]), d3.max(Object.values(newData[addr]), d => d[pollution])]) // Choose the pollution
            .range([height/21, 0]);
        
        // Construct an area generator
        const area = d3.area()
            .x(d => xScale(new Date(d[0])))
            .y0(height/21)
            .y1(d => yScale(d[1][pollution]));

        // Show the Horizon Chart
        addrSvg.append('path')
            .datum(Object.entries(newData[addr]))
            .attr('class', 'area')
            .attr('d', area)
            .attr('fill', colorMapping[pollution]);
        
        // Show the 'Address'
        addrSvg.append('text')
            .attr('x', 0)
            .attr('y', 0.5 * height/21)
            .attr('dy', '0.35em')
            .text(addr)
                .style('font-size', 10);
    });

    // Create xScale (time)
    const xScale = d3.scaleTime()
        .domain([new Date('2017-01-01'), new Date('2019-12-31')])
        .range([0, width]);

    // Add X axis
    const xAxis = d3.axisTop(xScale);
    svg.append('g')
        .attr('transform', `translate(0, 0)`)
        .call(xAxis);
}; 