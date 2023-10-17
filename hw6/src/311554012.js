// Load the dataset
d3.csv('../data/ma_lga_12345.csv').then(data => {
    // Preprocessing
    const parseDate = d3.timeParse('%d/%m/%Y');
    data.forEach(d => {
        d.saledate = parseDate(d.saledate);
        d.MA = +d.MA/10000;
        d.bedrooms = +d.bedrooms;
    });
    // Sort the data by 'saledate' in ascending order
    data.sort((a, b) => a.saledate - b.saledate);
    
    // Initialization
    const types = Array.from(new Set(data.map(d => `${d.type}-${d.bedrooms}b`))).sort();
    render(data, types);

    // `reorder-controller`: use to get the new order after the user drag the items
    const draggableContainers = document.querySelectorAll('.draggable');
    let draggedItem = null;

    // `array_swap`: swap the position of specific elements in array
    function array_swap(arr, index1, index2) {
        if (index1 < 0 || index1 >= arr.length || index2 < 0 || index2 >= arr.length) {
            // check the index is legal or not
            console.error("Invalid index");
            return arr;
        }
    
        // swap the elements
        [arr[index1], arr[index2]] = [arr[index2], arr[index1]];
    
        return arr;
    }

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

            // Update the order of `types`: swap the positions of the elements in the types array
            const fromIndex = types.indexOf(draggedItem.textContent.trim());
            const toIndex = types.indexOf(container.textContent.trim());
            array_swap(types, fromIndex, toIndex);

            // Update the chart
            svg.selectAll('g').remove();
            render(data, types);
        });
    });
});

// Build the Stacked Bar Charts
// Define the SVG dimensions and margins 
const margin = { top: 20, right: 20, bottom: 20, left: 20};
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select('#theme-river')
    .append('svg')
    .attr('width', 1300)
    .attr('height', 540)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// Render Function
const render = (data, types) => {
    // Data transformation
    const newData = [];
    data.forEach(d => {
        const saledate = d.saledate;
        const entryIndex = newData.findIndex(entry => entry.saledate.getTime() === saledate.getTime());
    
        if (entryIndex !== -1) {
            // If there is already a data item with the same 'saledate', update the data item
            newData[entryIndex][`${d.type}-${d.bedrooms}b`] = d.MA;
        } else {
            // Else, create a new data entry
            const newEntry = {saledate};

            // Add price to corresponding type and number of bedrooms
            types.forEach(type => {
                if (type === `${d.type}-${d.bedrooms}b`) {
                    newEntry[`${d.type}-${d.bedrooms}b`] = d.MA;
                } else {
                    newEntry[type] = 0;
                };
            });
            newData.push(newEntry);
        }
    });
    // console.log(newData);

    // Create xScale (time)
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.saledate))
        .range([0, width]);

    // Add X axis
    const xAxis = d3.axisBottom(xScale);
    svg.append('g')
        .attr('transform', `translate(40, ${height})`)
        .call(xAxis);

    // Create yScale (price)
    const yScale = d3.scaleLinear()
        .domain([0, 500])
        .range([height, 0]);

    // Add Y axis
    const yAxis = d3.axisLeft(yScale).tickFormat(d => d + 'K');
    svg.append('g')
        .attr('transform', `translate(40, 0)`)
        .call(yAxis);

    // Add axis names at left side and bottom side
    // Left side
    svg.selectAll('.column-label-left')
        .data(['Cumulative MA'])
        .enter().append('text')
        .text(d => d)
        .style('font-size', 14)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(-5, ${height*0.37}) rotate(-90)`)
        .attr('class', 'column-label-left');
    
    // Bottom side
    svg.selectAll('.column-label-bottom')
        .data(['Time'])
        .enter().append('text')
        .text(d => d)
        .style('font-size', 14)
        .attr('text-anchor', 'middle')
        .attr('transform', `translate(${width/2+40}, ${height+40})`)
        .attr('class', 'column-label-bottom');
    
    // Create colorMapping: avoid to change color by change the type order
    const colorMapping = {
        'house-2b': '#9ac8eb',
        'house-3b': '#d9a7c7',
        'house-4b': '#81C784',
        'house-5b': '#f3c7d5',
        'unit-1b': '#90A4AE',
        'unit-2b': '#f9c995',
        'unit-3b': '#f0e68c'
    };

    // Stack the data
    const stackedData = d3.stack()
        .keys(types)
        (newData);
    // console.log(stackedData);

    // Area generator
    var areaGenerator = d3.area()
        .x(d => xScale(d.data.saledate)+40)
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveBasis);
    
    // Show the area
    svg.append('g')
        .selectAll('layers')
        .data(stackedData)
        .enter()
        .append('path')
            .attr('class', 'area')
            .style('fill', d => colorMapping[d.key])
            .attr('d', areaGenerator)
            .on('mouseover', function(event,d) {
                d3.selectAll('.area')
                    .style('opacity', .2);

                d3.select(this)
                    .style('stroke', 'black')
                    .style('opacity', 1);
            })
            .on('mouseleave', function(event,d) {
                d3.selectAll('.area')
                    .style('opacity', 1)
                    .style('stroke', 'none');
            });
};