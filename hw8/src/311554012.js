// Load the dataset
d3.text('../data/car.data', text => {
    // Define the column names
    const columns = ['buying', 'maint', 'doors', 'persons', 'lug_boot', 'safety', 'class'];
    
    // Preprocee the dataset
    const data = d3.csvParseRows(text, (row, i) => {
        // Use the defined column names to create new object
        const rowData = {};
        columns.forEach((column, j) => {
            rowData[column] = row[j];
        });
        return rowData;
    });

    // Initialization
    // Define the features and its order
    var features = ['buying', 'maint', 'doors', 'persons', 'lug_boot', 'safety'];
    render(data, features);

    // ================== Interactivity ==================
    // `reorder-controller`: use to get the new order after the user drag the items
    const draggableContainers = document.querySelectorAll('.draggable');
    let draggedItem = null;

    // `array_swap`: swap the position of specific elements in array
    function array_swap(arr, index1, index2) {
        if (index1 < 0 || index1 >= arr.length || index2 < 0 || index2 >= arr.length) {
            // Check the index is legal or not
            console.error("Invalid index");
            return arr;
        };
    
        // Swap the elements
        [arr[index1], arr[index2]] = [arr[index2], arr[index1]];
        return arr;
    };

    // Add event listener
    draggableContainers.forEach(container => {
        container.addEventListener('dragstart', (event) => {
            // record the dragging item
            draggedItem = container;
        });

        container.addEventListener('dragover', (event) => {
            container.style.background = 'lightgray';
            event.preventDefault();
        });

        container.addEventListener('dragleave', (event) => {
            container.style.background = '';
        });

        container.addEventListener('drop', () => {
            // Change the position of the items
            container.style.background = '';

            // Swap the positions of the elements in the DOM
            const temp = document.createElement('div');
            draggedItem.parentNode.insertBefore(temp, draggedItem); // Add temp element before draggedItem
            container.parentNode.insertBefore(draggedItem, container);
            temp.parentNode.insertBefore(container, temp); // Add temp element before container
            temp.parentNode.removeChild(temp); // Remove temp element

            // Update the order of `features`: swap the positions of the elements in the features array
            const fromIndex = features.indexOf(draggedItem.textContent.trim());
            const toIndex = features.indexOf(container.textContent.trim());
            array_swap(features, fromIndex, toIndex);

            // Update the chart
            svg.selectAll('g').remove();
            render(data, features);
        });
    });
});

// Build the Stacked Bar Charts
// Define the SVG dimensions and margins 
const margin = { top: 20, right: 20, bottom: 20, left: 20};
const width = 1100 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select('#sankey-diagram')
    .append('svg')
    .attr('width', 1200)
    .attr('height', 540)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// Render Function
const render = (data, features) => {
    // Create `attributes` as the combination of each feature and class
    var combo = [];
    data.forEach(d => {
        for (let i = 0; i < features.length; i++) {
            combo.push(`${features[i]}-${d[features[i]]}`);
        };
    });
    
    // Remove duplicate combo
    combo = Array.from(new Set(combo));

    // Sort combo based on the order of features
    combo.sort((a, b) => {
        const featureA = a.split('-')[0];
        const featureB = b.split('-')[0];

        return features.indexOf(featureA) - features.indexOf(featureB);
    });
    // console.log(combo);

    // Create `nodes`: {node: 'number', name: 'column-class'}
    var nodes = [];
    for (let i = 0; i < combo.length; i++) {
        nodes.push({'node': i, 'name': `${combo[i]}`});
    };
    // console.log(nodes);

    // Create `attributes`, each combination of features and categories
    var attributes = [];
    data.forEach(d => {
        for (let i = 0; i < features.length - 1; i++) {
            const currentFeature = features[i];
            const nextFeature = features[i + 1];

            const currentAttribute = `${currentFeature}-${d[currentFeature]}`;
            const nextAttribute = `${nextFeature}-${d[nextFeature]}`;

            attributes.push({source: currentAttribute, target: nextAttribute});
        };
    });
    // Count the number of occurrences of a combination between two adjacent columns
    var counts = {};
    attributes.forEach(attr => {
        const key = `${attr.source}->${attr.target}`;
        counts[key] = (counts[key] || 0) + 1;
    });

    // Create `links`: {source: 'number', target: 'number', value: 'number'}
    var links = Object.entries(counts).map(([key, value]) => {
        const [source, target] = key.split('->');
    
        const sourceIndex = nodes.findIndex(node => node.name === source);
        const targetIndex = nodes.findIndex(node => node.name === target);
    
        return {source: sourceIndex, target: targetIndex, value};
    });
    // console.log(links);

    // Create a Sankey diagram
    const sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .size([width, height]);
    
    sankey.nodes(nodes)
        .links(links)
        .layout(1);
    
    // Create `colorMapping`: avoid to change color by change the type order
    const colorMapping = {
        'buying': '#9ac8eb',
        'maint': '#d9a7c7',
        'doors': '#81C784',
        'persons': '#f3c7d5',
        'lug_boot': '#90A4AE',
        'safety': '#f9c995',
    };

    // Add in the links
    const link = svg.append('g')
        .selectAll('.link')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', sankey.link())
        .style('stroke', d => {
            const sourceColor = colorMapping[d.source.name.split('-')[0]];
            const targetColor = colorMapping[d.target.name.split('-')[0]];
            // Use D3 interpolator to generate mixed colors
            const colorInterpolator = d3.interpolate(sourceColor, targetColor);
            return colorInterpolator(0.5); // Adjust the interpolation position to get a darker or lighter color
        })
        .style('stroke-width', d => Math.max(1, d.dy))
        .sort((a, b) => b.dy - a.dy);

    // Add in the nodes
    const node = svg.append('g')
        .selectAll('.node')
        .data(nodes)
        .enter().append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .call(d3.drag()
                .subject(d => d)
                .on('start', function(d, event) {
                    this.parentNode.appendChild(this);
                })
                .on('drag', function(d, event) {
                    // Add the function for moving nodes
                    d3.select(this)
                        .attr('transform', `translate(${d.x}, ${d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))})`);
                    sankey.relayout();
                    link.attr('d', sankey.link());
                })
            );
    
    // Add the rectangles for the nodes
    node.append('rect')
        .attr('height', d => d.dy)
        .attr('width', sankey.nodeWidth())
        .style('fill', d => colorMapping[d.name.split('-')[0]])
        .style('stroke', '#000000')
        .append('title')
        .text(d => `${d.name}, ${d.node}`)
    
    // Add title for the nodes
    node.append('text')
        .attr('x', d => (d.x < width / 2) ? (sankey.nodeWidth() + 6) : -6)
        .attr('y', d => d.dy / 2)
        .attr('dy', '.35em')
        .attr('text-anchor', d => (d.x < width / 2) ? 'start' : 'end')
        .text(d => d.name)
            .style('font-size', '0.85em');
}; 