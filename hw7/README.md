## hw7: Horizon Chart

### About
Craft a horizon chart to represent air pollution data using D3.

**Example code:** https://observablehq.com/@d3/horizon-chart <br>
**Data Source:** https://www.kaggle.com/datasets/bappekim/air-pollution-in-seoul
- **Districts & Pollutants:** <br> There are 25 districts in Seoul, and data is available for 6 different pollutants. This necessitates the creation of 150 horizon charts.
- **Data Period:** <br> The dataset covers hourly readings from 2017 through 2019. For this assignment, you should let users focus solely on data from a specific year.

### Requirements
- **Data Preparation:** <br> Aggregate hourly data into daily summaries. You can use the mean, median, or another appropriate measure as a representative value for each day.

- **Horizon Chart Creation:** <br> Develop a horizon chart for each combination of district and pollutant, resulting in 150 charts. Ensure clear labeling for each chart indicating the district and pollutant it represents.

- **Color Variations:** <br> Use distinguishable colors for different pollutants to provide clear visual differentiation.

- **Layout:** <br> Organize charts in a grid or another systematic arrangement, ensuring easy comparison and identification.

- **Interactivity (optional):** <br> Add features like tooltips for detailed daily values or zoom capabilities to focus on specific periods.

### References
[1] [D3 Horizon Chart - Drawing horizon charts in the browser and node](https://kmandov.github.io/d3-horizon-chart/)