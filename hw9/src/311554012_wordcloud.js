// Load the dataset
d3.csv('../data/spotify.csv').then(data => {
    // EventListener for `search-bar`
    document.getElementById('sb-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            // Update the `inputValue`  
            var inputValue = event.target.value;
            // console.log('Input Value: ' + inputValue);
            wordCloud_svg.selectAll('g').remove();
            wordCloud_svg.selectAll('rect').remove();
            wordCloud_svg.selectAll('text').remove();
            if (inputValue.trim() !== '') {
                render_wordcloud(data.filter(d => d.artist === inputValue));
            } else {
                render_wordcloud(data.slice(0, 100));
            }
        }
    });
    
    // Initialization
    // console.log(data);
    render_wordcloud(data.slice(0, 100));
});

// Build the Word cloud
// Define the SVG dimensions and margins 
const wordCloud_margin = { top: 20, right: 10, bottom: 40, left: 50};
const wordCloud_width = 950 - wordCloud_margin.left - wordCloud_margin.right;
const wordCloud_height = 300 - wordCloud_margin.top - wordCloud_margin.bottom;

// Create the SVG container
const wordCloud_svg = d3.select('#world-cloud')
    .append('svg')
    .attr('width', 950)
    .attr('height', 300)
    .append('g')
    .attr('transform', `translate(${wordCloud_margin.left}, ${wordCloud_margin.top})`);

// Render Function: to draw a word cloud for 'songs name' based on 'popularity'
const render_wordcloud = (data) => {
    // Extract the 'track_name' from `data`
    const track_names = Array.from(new Set(data.map(d => d.track_name)));
    const words = track_names.map(name => {
        const values = data.filter(d => d.track_name === name).map(d => +d['popularity']);
        const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
        const tempo = Array.from(new Set(data.filter(d => d.track_name === name).map(d => d['tempo'])))[0];
        return { text: name, size: +mean, tempo: tempo };
    });

    // Set up the layout
    const layout = d3.layout.cloud()
        .size([wordCloud_width, wordCloud_height])
        .words(words)
        .padding(1)  // Adjust as needed
        .rotate(0)
        // .rotate(() => -0.5 * 30)  // Rotate words randomly
        .font('sans-serif')
        .fontSize(d => Math.sqrt(d.size)*2+10)
        .on("end", draw);

    // Start the layout
    layout.start();

    // Draw the word cloud
    function draw(words) {
        // Create a color scale for tempos
        const tempoOrder = ['Larghissimo', 'Grave', 'Largo', 'Larghetto', 'Adagio', 
                            'Andante', 'Moderato', 'Allegro', 'Presto', 'Prestissimo'];
        const colorScale = d3.scaleOrdinal()
            .domain(tempoOrder)
            .range(["#fff7f3","#fde2df","#fccac8","#fbabb8","#f880aa","#ea519d","#cc238e","#a2057e","#750175","#49006a"]);
        
        wordCloud_svg.selectAll("text")
            .data(words)
            .enter()
            .append("text")
                .style("font-size", d => `${d.size}px`)
                .style("font-family", "sans-serif")
                .attr("transform", d => `translate(${wordCloud_width/2 - 15 + d.x}, ${wordCloud_height/2 + 15 + d.y})rotate(${d.rotate})`)
                .attr("text-anchor", "middle")
            .text(d => d.text)
                .style('fill', d => colorScale(d.tempo));
    };
};