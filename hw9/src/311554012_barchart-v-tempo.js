// Load the dataset
d3.csv('../data/spotify.csv').then(data => {
    // EventListener for `search-bar`
    document.getElementById('sb-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            // Update the `inputValue`  
            var inputValue = event.target.value;
            // console.log('Input Value: ' + inputValue);
            tempo_svg.selectAll('g').remove();
            tempo_svg.selectAll('rect').remove();
            tempo_svg.selectAll('text').remove();
            if (inputValue.trim() !== '') {
                render_tempo(data.filter(d => d.artist === inputValue));
            } else {
                render_tempo(data);
            };
        };
    });
    
    // Initialization
    // console.log(data);
    render_tempo(data);
});

// Build the Bar Chart
// Define the tempo_SVG dimensions and margins 
const tempo_margin = { top: 20, right: 10, bottom: 40, left: 50};
const tempo_width = 650 - tempo_margin.left - tempo_margin.right;
const tempo_height = 300 - tempo_margin.top - tempo_margin.bottom;

// Create the SVG container
const tempo_svg = d3.select('#barchart-v-tempo')
    .append('svg')
    .attr('width', 650)
    .attr('height', 300)
    .append('g')
    .attr('transform', `translate(${tempo_margin.left}, ${tempo_margin.top})`);

// Render Function: to draw a bar chart for 'tempo' vs. 'songs number'
const render_tempo = (data) => {
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
        .range([0, tempo_width])
        .padding(0.2);
    tempo_svg.append('g')
        .attr('transform', 'translate(0,' + tempo_height + ')')
        .call(d3.axisBottom(xScale));

    // Y-axis: scale and draw
    var countsArray = Object.values(tempoCounts);
    var maxCount = Math.max(...countsArray);
    var yScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([tempo_height, 0]);
    tempo_svg.append('g')
        .call(d3.axisLeft(yScale));

    // Add axis name at left and bottom sides
    tempo_svg.selectAll('.y-axis-name') // Left side
        .data(['Counts'])
        .enter().append('text')
        .text(d => d)
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(0, -8)`)
        .attr('class', 'axis-name');
    tempo_svg.selectAll('.x-axis-name') // Bottom side
        .data(['Tempo'])
        .enter().append('text')
        .text(d => d)
        .attr('font-size', 12)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(${(tempo_width+40)/2}, ${tempo_height+35})`)
        .attr('class', 'axis-name');

    // Create a color scale for tempos
    const colorScale = d3.scaleOrdinal()
        .domain(tempoOrder)
        .range(["#fff7f3","#fde2df","#fccac8","#fbabb8","#f880aa","#ea519d","#cc238e","#a2057e","#750175","#49006a"]);

    // Create bar chart
    tempo_svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.tempo))
        .attr('y', d => yScale(tempoCounts[d.tempo]))
        .attr('width', xScale.bandwidth(0))
        .attr('height', d => tempo_height - yScale(tempoCounts[d.tempo]))
        .attr('fill', d => colorScale(d.tempo));
};