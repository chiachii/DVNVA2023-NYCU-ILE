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
                render_bc_tempo(data.filter(d => d.artist === inputValue));
            } else {
                render_bc_tempo(data);
            }
        }
    });
    
    // Initialization
    // console.log(data);
    render_bc_tempo(data);
});

// Build the Bar Chart
// Define the SVG dimensions and margins 
const margin = { top: 20, right: 10, bottom: 40, left: 50};
const width = 650 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select('#barchart-v-tempo')
    .append('svg')
    .attr('width', 650)
    .attr('height', 300)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// Render Function: to draw a bar chart for 'tempo' vs. 'songs number'
const render_bc_tempo = (data) => {
    // Counting for corresponding 'tempo' from data
    const tempoOrder = ['Larghissimo', 'Grave', 'Largo', 'Larghetto', 'Adagio', 
                        'Andante', 'Moderato', 'Allegro', 'Presto', 'Prestissimo'];
    var tempoCounts = {};
    data.forEach(d => {
        if (tempoCounts[d.tempo]) {
            tempoCounts[d.tempo]++;
        } else {
            tempoCounts[d.tempo] = 1;
        };
    });

    // X-axis: scale and draw
    var xScale = d3.scaleBand()
        .domain(tempoOrder)
        .range([0, width])
        .padding(0.2);
    svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(xScale));

    // Y-axis: scale and draw
    var countsArray = Object.values(tempoCounts);
    var maxCount = Math.max(...countsArray);
    var yScale = d3.scaleLinear()
        .domain([0, maxCount])
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
        .data(['Tempo'])
        .enter().append('text')
        .text(d => d)
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(${(width+40)/2}, ${height+35})`)
        .attr('class', 'axis-name');

    // Create a color scale for tempos
    const colorScale = d3.scaleOrdinal()
        .domain(tempoOrder)
        .range(["#fff7f3","#fde2df","#fccac8","#fbabb8","#f880aa","#ea519d","#cc238e","#a2057e","#750175","#49006a"]);

    // Create bar chart
    svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.tempo))
        .attr('y', d => yScale(tempoCounts[d.tempo]))
        .attr('width', xScale.bandwidth(0))
        .attr('height', d => height - yScale(tempoCounts[d.tempo]))
        .attr('fill', d => colorScale(d.tempo));
};