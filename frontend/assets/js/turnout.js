/**
 * JavaScript for the voter turnout analysis page
 */

// Store charts for later reference and update
let nationalTurnoutChart = null;
let stateTurnoutChart = null;
let highTurnoutChart = null;
let stateTurnoutComparisonChart = null;
let turnoutTable = null;

// Initialize the page once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load national turnout data
    loadNationalTurnoutData();
    
    // Load state-wise turnout data
    loadStateTurnoutData();
    
    // Load high turnout constituencies data
    loadHighTurnoutData();
    
    // Load states for comparison dropdown
    loadStatesForComparison();
    
    // Add event listener for compare turnout button
    document.getElementById('compareTurnoutBtn').addEventListener('click', compareStateTurnout);
    
    // Load turnout table data
    loadTurnoutTableData();
});

/**
 * Load national turnout data
 */
async function loadNationalTurnoutData() {
    try {
        const turnoutData = await utils.fetchData('turnout');
        
        if (!turnoutData || !turnoutData.years || turnoutData.years.length === 0) {
            console.error('No turnout data available');
            return;
        }
        
        // Create chart
        nationalTurnoutChart = charts.createLineChart(
            'nationalTurnoutChart',
            turnoutData.years,
            [{
                label: 'Average Turnout (%)',
                data: turnoutData.avg_turnout,
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }],
            {
                plugins: {
                    title: {
                        display: true,
                        text: 'National Voter Turnout Trend (2004-2024)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: Math.max(0, Math.min(...turnoutData.avg_turnout) - 5),
                        max: Math.min(100, Math.max(...turnoutData.avg_turnout) + 5),
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        );
        
    } catch (error) {
        console.error('Error loading national turnout data:', error);
    }
}

/**
 * Load state-wise turnout data
 */
async function loadStateTurnoutData() {
    try {
        const turnoutData = await utils.fetchData('turnout');
        
        if (!turnoutData || !turnoutData.state_turnout || Object.keys(turnoutData.state_turnout).length === 0) {
            console.error('No state turnout data available');
            return;
        }
        
        // Get the latest year
        const latestYear = turnoutData.years[turnoutData.years.length - 1];
        
        // Get state turnout data for the latest year
        const states = [];
        const turnouts = [];
        
        for (const [state, yearlyTurnouts] of Object.entries(turnoutData.state_turnout)) {
            const latestYearIndex = turnoutData.years.indexOf(latestYear);
            
            if (latestYearIndex >= 0 && latestYearIndex < yearlyTurnouts.length && yearlyTurnouts[latestYearIndex] !== null) {
                states.push(state);
                turnouts.push(yearlyTurnouts[latestYearIndex]);
            }
        }
        
        // Sort states by turnout
        const stateData = states.map((state, index) => ({ state, turnout: turnouts[index] }));
        stateData.sort((a, b) => b.turnout - a.turnout);
        
        const sortedStates = stateData.map(item => item.state);
        const sortedTurnouts = stateData.map(item => item.turnout);
        
        // Generate colors based on turnout values
        const colors = sortedTurnouts.map(turnout => {
            // Color gradient from red (low turnout) to green (high turnout)
            const hue = (turnout / 100) * 120; // 0 = red, 120 = green
            return `hsl(${hue}, 70%, 50%)`;
        });
        
        // Create chart
        stateTurnoutChart = charts.createHorizontalBarChart(
            'stateTurnoutChart',
            sortedStates,
            [{
                label: 'Turnout (%)',
                data: sortedTurnouts,
                backgroundColor: colors,
                borderWidth: 1
            }],
            {
                plugins: {
                    title: {
                        display: true,
                        text: `State-wise Turnout in ${latestYear} Election`
                    }
                },
                scales: {
                    x: {
                        beginAtZero: false,
                        min: Math.max(0, Math.min(...sortedTurnouts) - 5),
                        max: Math.min(100, Math.max(...sortedTurnouts) + 5),
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        );
        
    } catch (error) {
        console.error('Error loading state turnout data:', error);
    }
}

/**
 * Load high turnout constituencies data
 */
async function loadHighTurnoutData() {
    try {
        // Fetch years data
        const years = await utils.fetchData('years');
        
        if (!years || years.length === 0) {
            console.error('No years data available');
            return;
        }
        
        // Get the latest year
        const latestYear = years.sort().reverse()[0];
        
        // Fetch election data for the latest year
        const electionData = await utils.fetchData(`election/${latestYear}`);
        
        if (!electionData || !electionData.constituencies) {
            console.error('No election data available');
            return;
        }
        
        // Filter constituencies with turnout data
        const constituenciesWithTurnout = electionData.constituencies.filter(c => {
            return c.turnout && !isNaN(parseFloat(c.turnout));
        });
        
        // Extract turnout values and sort
        constituenciesWithTurnout.forEach(c => {
            c.turnoutValue = parseFloat(c.turnout.replace('%', ''));
        });
        
        constituenciesWithTurnout.sort((a, b) => b.turnoutValue - a.turnoutValue);
        
        // Get top 10 constituencies by turnout
        const topConstituencies = constituenciesWithTurnout.slice(0, 10);
        
        const constituencyNames = topConstituencies.map(c => c.constituency);
        const turnoutValues = topConstituencies.map(c => c.turnoutValue);
        
        // Create chart
        highTurnoutChart = charts.createHorizontalBarChart(
            'highTurnoutChart',
            constituencyNames,
            [{
                label: 'Turnout (%)',
                data: turnoutValues,
                backgroundColor: '#4caf50',
                borderWidth: 1
            }],
            {
                plugins: {
                    title: {
                        display: true,
                        text: `Top 10 High Turnout Constituencies (${latestYear})`
                    }
                },
                scales: {
                    x: {
                        beginAtZero: false,
                        min: Math.max(0, Math.min(...turnoutValues) - 2),
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        );
        
    } catch (error) {
        console.error('Error loading high turnout data:', error);
    }
}

/**
 * Load states for comparison dropdown
 */
async function loadStatesForComparison() {
    try {
        const turnoutData = await utils.fetchData('turnout');
        
        if (!turnoutData || !turnoutData.state_turnout || Object.keys(turnoutData.state_turnout).length === 0) {
            console.error('No state turnout data available');
            return;
        }
        
        // Get states with turnout data
        const states = Object.keys(turnoutData.state_turnout);
        
        // Populate state select
        const stateSelect = document.getElementById('stateTurnoutSelect');
        stateSelect.innerHTML = '';
        
        states.sort().forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading states for comparison:', error);
    }
}

/**
 * Compare turnout of selected states
 */
function compareStateTurnout() {
    const stateSelect = document.getElementById('stateTurnoutSelect');
    const selectedStates = Array.from(stateSelect.selectedOptions).map(option => option.value);
    
    if (selectedStates.length === 0) {
        alert('Please select at least one state to compare');
        return;
    }
    
    loadStateTurnoutComparisonData(selectedStates);
}

/**
 * Load turnout comparison data for selected states
 * @param {string[]} states - States to compare
 */
async function loadStateTurnoutComparisonData(states) {
    try {
        const turnoutData = await utils.fetchData('turnout');
        
        if (!turnoutData || !turnoutData.state_turnout || !turnoutData.years) {
            console.error('No turnout data available');
            return;
        }
        
        // Prepare datasets
        const datasets = [];
        
        states.forEach((state, index) => {
            if (turnoutData.state_turnout[state]) {
                datasets.push({
                    label: state,
                    data: turnoutData.state_turnout[state],
                    borderColor: utils.getPartyColor('', index),
                    backgroundColor: `${utils.getPartyColor('', index)}30`,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                });
            }
        });
        
        // Add national average for comparison
        datasets.push({
            label: 'National Average',
            data: turnoutData.avg_turnout,
            borderColor: '#000000',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.1
        });
        
        // Destroy previous chart if it exists
        if (stateTurnoutComparisonChart) {
            charts.destroyChart(stateTurnoutComparisonChart);
        }
        
        // Create new chart
        stateTurnoutComparisonChart = charts.createLineChart(
            'stateTurnoutComparisonChart',
            turnoutData.years,
            datasets,
            {
                plugins: {
                    title: {
                        display: true,
                        text: 'State-wise Turnout Comparison (2004-2024)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 0,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        );
        
    } catch (error) {
        console.error('Error loading state turnout comparison data:', error);
    }
}

/**
 * Load turnout table data
 */
async function loadTurnoutTableData() {
    try {
        const turnoutData = await utils.fetchData('turnout');
        
        if (!turnoutData || !turnoutData.state_turnout || !turnoutData.years) {
            console.error('No turnout data available');
            return;
        }
        
        // Prepare table data
        const tableBody = document.querySelector('#turnoutTable tbody');
        let html = '';
        
        const states = Object.keys(turnoutData.state_turnout).sort();
        
        states.forEach(state => {
            const turnouts = turnoutData.state_turnout[state];
            
            // Skip states with no turnout data
            if (!turnouts || turnouts.every(t => t === null)) {
                return;
            }
            
            const validTurnouts = turnouts.filter(t => t !== null);
            const avgTurnout = validTurnouts.length > 0 ? 
                (validTurnouts.reduce((sum, t) => sum + t, 0) / validTurnouts.length).toFixed(2) : 
                'N/A';
            
            const firstTurnout = turnouts[0] !== null ? turnouts[0] : null;
            const lastTurnout = turnouts[turnouts.length - 1] !== null ? turnouts[turnouts.length - 1] : null;
            
            let change = 'N/A';
            let changeClass = '';
            
            if (firstTurnout !== null && lastTurnout !== null) {
                const turnoutChange = (lastTurnout - firstTurnout).toFixed(2);
                change = turnoutChange > 0 ? `+${turnoutChange}%` : `${turnoutChange}%`;
                
                if (turnoutChange > 0) changeClass = 'text-success';
                else if (turnoutChange < 0) changeClass = 'text-danger';
            }
            
            html += `<tr><td>${state}</td>`;
            
            // Add cells for each year
            turnoutData.years.forEach((year, index) => {
                const turnout = turnouts[index] !== null ? turnouts[index].toFixed(2) + '%' : 'N/A';
                html += `<td>${turnout}</td>`;
            });
            
            // Add average and change
            html += `<td>${avgTurnout !== 'N/A' ? avgTurnout + '%' : 'N/A'}</td>`;
            html += `<td class="${changeClass}">${change}</td></tr>`;
        });
        
        tableBody.innerHTML = html;
        
        // Initialize DataTable
        if ($.fn.DataTable.isDataTable('#turnoutTable')) {
            turnoutTable.destroy();
        }
        
        turnoutTable = $('#turnoutTable').DataTable({
            pageLength: 15,
            lengthMenu: [15, 25, 50, 100],
            responsive: true,
            order: [[7, 'desc']] // Sort by change column by default
        });
        
    } catch (error) {
        console.error('Error loading turnout table data:', error);
    }
}
