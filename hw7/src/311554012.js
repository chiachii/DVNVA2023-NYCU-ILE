// Load the dataset
d3.csv('../data/air-pollution.csv').then(data => {
    // Define the default (global) value: `pollution`
    var pollution = 'CO';
    var year = '2017';
    var bands = '3';

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
    data.sort((a, b) => a['Measurement date'].slice(0, 10) - b['Measurement date'].slice(0, 10));

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
        render(data, pollution, year, bands);
    });

    // `year-selector`: update the value of the `year`
    d3.select('#year-select').on('change', function() {
        year = this.value; // Global Scope

        // Update charts
        svg.selectAll('g').remove();
        render(data, pollution, year, bands);
    });

    // `bands-selector`: update the value of the `bands`
    const bandsSelect = d3.select('#bands-select');
    const bandsOptions = Object.keys([...Array(9).keys()]);

    bandsSelect.selectAll('option')
        .data(bandsOptions)
        .enter()
        .append('option')
        .text(d => +(d)+1)
        .attr('value', d => +(d)+1);

    // Define the default value of `bands-select`
    d3.select('#bands-select').property('value', '3');

    d3.select('#bands-select').on('change', function() {
        bands = +this.value; // Global Scope

        // Update charts
        svg.selectAll('g').remove();
        render(data, pollution, year, bands);
    });

    // Initialization
    // console.log(data);
    render(data, pollution, year, bands);
});

// Build the Horizon Chart
// Define the SVG dimensions and margins 
const margin = { top: 20, right: 20, bottom: 20, left: 20};
const width = 1100 - margin.left - margin.right;
const height = 900 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select('#horizon-chart')
    .append('svg')
    .attr('class', 'horizon')
    .attr('width', 1200)
    .attr('height', 950)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// dataLoader Function
const dataLoader = (data, year) => {
    // Create `meanData`: Group the data by 'Address' & Compute the mean value of each pollution by date
    const meanData = [];
    data.forEach(d => {
        // Extract the `addrKey` and `dateKey`
        var addrKey = d['Address'];
        var dateKey = d['Measurement date'].slice(0, 10);

        // Check if the date is within the selected range
        if (new Date(`${year}-01-01`) <= new Date(dateKey) && new Date(dateKey) <= new Date(`${year}-12-31`)) {
            // Create entries for each 'Address'
            if (!meanData[addrKey]) {
                meanData[addrKey] = {};
            };
            // If the date does not in the 'Address', then create one
            if (!meanData[addrKey][dateKey]) {
                meanData[addrKey][dateKey] = {
                    'CO': 0, 'NO2': 0, 'O3': 0, 'PM2.5': 0, 'PM10': 0, 'SO2': 0
                };
            };

            // Accumulate the mean of pollution value
            meanData[addrKey][dateKey]['CO'] += d['CO']/24;
            meanData[addrKey][dateKey]['NO2'] += d['NO2']/24;
            meanData[addrKey][dateKey]['O3'] += d['O3']/24;
            meanData[addrKey][dateKey]['PM2.5'] += d['PM2.5']/24;
            meanData[addrKey][dateKey]['PM10'] += d['PM10']/24;
            meanData[addrKey][dateKey]['SO2'] += d['SO2']/24;
        };
    });

    return meanData;
};

// Render Function
const render = (data, pollution, year, bands) => {
    // Create `newData`: Reformat the dataset for specific pollution
    const meanData = dataLoader(data, year);
    
    var newData = [];
    Object.keys(meanData).forEach(address => {
        Object.keys(meanData[address]).forEach(date => {
            // value.push(meanData[address][date]['SO2']);
            value = meanData[address][date][pollution];
            newData.push({
                'address': address, // Z-axis
                'date': new Date(date), // X-axis
                'value': value // Y-axis
            });
        });
    });
    // console.log(newData);

    // Create colorMapping
    const colorMapping = {
        'CO': d3.schemeBlues,
        'NO2': d3.schemeGreens,
        'O3': d3.schemeGreys,
        'PM2.5': d3.schemeOrRd,
        'PM10': d3.schemeReds,
        'SO2': d3.schemePurples
    };

    // Show the Horizon Charts
    const chart = HorizonChart(newData, {
        x: d => d.date,
        y: d => d.value,
        z: d => d.address,
        bands: +bands,
        width: width,
        scheme: colorMapping[pollution]
    });
    svg.node().appendChild(chart);
};

// HorizionChart Function
function HorizonChart(data, {
    // Copyright 2021 Observable, Inc.
    // Released under the ISC license.
    // https://observablehq.com/@d3/horizon-chart

    x = ([x]) => x, // given d in data, returns the (temporal) x-value
    y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
    z = () => 1, // given d in data, returns the (categorical) z-value
    defined, // for gaps in data
    curve = d3.curveLinear, // method of interpolation between points
    marginTop = 20, // top margin, in pixels
    marginRight = 0, // right margin, in pixels
    marginBottom = 0, // bottom margin, in pixels
    marginLeft = 0, // left margin, in pixels
    width = 640, // outer width, in pixels
    size = 35, // outer height of a single horizon, in pixels
    bands = 3, // number of bands
    padding = 1, // separation between adjacent horizons
    xType = d3.scaleUtc, // type of x-scale
    xDomain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight], // [left, right]
    yType = d3.scaleLinear, // type of y-scale
    yDomain, // [ymin, ymax]
    yRange = [size, size - bands * (size - padding)], // [bottom, top]
    zDomain, // array of z-values
    scheme = d3.schemeBlues, // color scheme; shorthand for colors
    colors = scheme[Math.max(3, bands)], // an array of colors
  } = {}) {
    // Compute values.
    const X = d3.map(data, x);
    const Y = d3.map(data, y);
    const Z = d3.map(data, z);
    if (defined === undefined) defined = (d, i) => !isNaN(X[i]) && !isNaN(Y[i]);
    const D = d3.map(data, defined);

    // Compute default domains, and unique the z-domain.
    if (xDomain === undefined) xDomain = d3.extent(X);
    if (yDomain === undefined) yDomain = [0, d3.max(Y)];
    if (zDomain === undefined) zDomain = Z;
    zDomain = new d3.InternSet(zDomain);
  
    // Omit any data not present in the z-domain.
    const I = d3.range(X.length).filter(i => zDomain.has(Z[i]));
  
    // Compute height.
    const height = zDomain.size * size + marginTop + marginBottom;
  
    // Construct scales and axes.
    const xScale = xType(xDomain, xRange);
    const yScale = yType(yDomain, yRange);
    const xAxis = d3.axisTop(xScale).ticks(width / 80).tickSizeOuter(0);
    
    // A unique identifier for clip paths (to avoid conflicts).
    const uid = `O-${Math.random().toString(16).slice(2)}`;
  
    // Construct an area generator.
    const area = d3.area()
        .defined(i => D[i])
        .curve(curve)
        .x(i => xScale(X[i]))
        .y0(yScale(0))
        .y1(i => yScale(Y[i]));
    
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
        // .attr('stroke', '#000000') // Modify: add stroke
        // .attr('stroke-width', 0.1) 
        .attr("font-family", "sans-serif")
        .attr("font-size", 10);
  
    const g = svg.selectAll("g")
      .data(d3.group(I, i => Z[i]))
      .join("g")
        .attr("transform", (_, i) => `translate(0,${i * size + marginTop})`);
  
    const defs = g.append("defs");
  
    defs.append("clipPath")
        .attr("id", (_, i) => `${uid}-clip-${i}`)
      .append("rect")
        .attr("y", padding)
        .attr("width", width)
        .attr("height", size - padding);
  
    defs.append("path")
        .attr("id", (_, i) => `${uid}-path-${i}`)
        .attr("d", ([, I]) => area(I));
  
    g.attr("clip-path", (_, i) => `url(${new URL(`#${uid}-clip-${i}`, location)})`)
      .selectAll("use")
      .data((d, i) => new Array(bands).fill(i))
      .join("use")
        .attr("fill", (_, i) => colors[i + Math.max(0, 3 - bands)])
        .attr("transform", (_, i) => `translate(0,${i * size})`)
        .attr("xlink:href", (i) => `${new URL(`#${uid}-path-${i}`, location)}`);
  
    g.append("text")
        .attr("x", marginLeft)
        .attr("y", (size + padding) / 2)
        .attr("dy", "0.35em")
        .text(([z]) => z);
  
    // Since there are normally no left or right margins, don’t show ticks that
    // are close to the edge of the chart, as these ticks are likely to be clipped.
    svg.append("g")
        .attr("transform", `translate(0,${marginTop})`)
        .call(xAxis)
        .call(g => g.selectAll(".tick")
          .filter(d => xScale(d) < 10 || xScale(d) > width - 10)
          .remove())
        .call(g => g.select(".domain").remove());
  
    return svg.node();
  }