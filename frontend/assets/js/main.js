/**
 * Main JavaScript file for the Lok Sabha Elections Dashboard home page
 */

// Store charts for later reference and update
let partiesChart = null;
let turnoutChart = null;
let marginDistChart = null;
let stateChart = null;

// Initialize the dashboard once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load available years for the dropdown
    loadYears();
    
    // Add event listener for year selection
    const yearSelect = document.getElementById('yearSelect');
    yearSelect.addEventListener('change', function() {
        loadDashboardData(this.value);
    });
});

/**
 * Load available election years
 */
async function loadYears() {
    try {
        const years = await utils.fetchData('years');
        
        if (!years || years.length === 0) {
            console.error('No years data available');
            return;
        }
        
        const yearSelect = document.getElementById('yearSelect');
        yearSelect.innerHTML = '';
        
        // Add options for each year, with the latest year selected by default
        years.sort().reverse().forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year} Lok Sabha Election`;
            yearSelect.appendChild(option);
        });
        
        // Load dashboard data for the latest year
        loadDashboardData(years[years.length - 1]);
        
    } catch (error) {
        console.error('Error loading years:', error);
    }
}

/**
 * Load dashboard data for the selected year
 * @param {string} year - Selected election year
 */
async function loadDashboardData(year) {
    try {
        // Show loading indicators
        document.getElementById('quickStats').innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        
        // Fetch election data for the selected year
        const electionData = await utils.fetchData(`election/${year}`);
        
        if (!electionData || electionData.error) {
            console.error('Error loading election data:', electionData.error);
            return;
        }
        
        // Update quick stats
        updateQuickStats(electionData);
        
        // Update party performance chart
        updatePartiesChart(electionData);
        
        // Update constituencies table
        updateConstituenciesTable(electionData);
        
        // Get turnout data and update chart
        updateTurnoutChart(year);
        
        // Update win margin distribution chart
        updateMarginDistChart(electionData);
        
        // Update state-wise seat distribution chart
        updateStateChart(electionData);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

/**
 * Update quick stats section
 * @param {Object} data - Election data
 */
function updateQuickStats(data) {
    const quickStats = document.getElementById('quickStats');
    
    if (!data || !data.party_seats || !data.constituencies) {
        quickStats.innerHTML = '<div class="alert alert-warning">No data available</div>';
        return;
    }
    
    // Count total seats and find the party with most seats
    const totalSeats = data.constituencies.length;
    const partySeatsSorted = Object.entries(data.party_seats).sort((a, b) => b[1] - a[1]);
    const leadingParty = partySeatsSorted.length > 0 ? partySeatsSorted[0] : ['N/A', 0];
    
    // Calculate average turnout
    const avgTurnout = data.avg_turnout ? data.avg_turnout.toFixed(2) : 'N/A';
    
    // Create HTML content
    let html = `
        <div class="stat-box bg-primary">
            <div class="stat-label">Total Constituencies</div>
            <div class="stat-value">${totalSeats}</div>
        </div>
        <div class="stat-box" style="background-color: ${utils.getPartyColor(leadingParty[0])}">
            <div class="stat-label">Leading Party</div>
            <div class="stat-value">${leadingParty[0]}</div>
            <div class="stat-label">${leadingParty[1]} Seats</div>
        </div>
        <div class="stat-box bg-success">
            <div class="stat-label">Average Turnout</div>
            <div class="stat-value">${avgTurnout}%</div>
        </div>
    `;
    
    quickStats.innerHTML = html;
}

/**
 * Update party performance chart
 * @param {Object} data - Election data
 */
function updatePartiesChart(data) {
    if (!data || !data.party_seats) {
        return;
    }
    
    // Get top 10 parties by seat count
    const topParties = Object.entries(data.party_seats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const labels = topParties.map(party => party[0]);
    const seats = topParties.map(party => party[1]);
    const colors = labels.map((party, index) => utils.getPartyColor(party, index));
    
    // Destroy previous chart if it exists
    if (partiesChart) {
        charts.destroyChart(partiesChart);
    }
    
    // Create new chart
    partiesChart = charts.createBarChart(
        'partiesChart',
        labels,
        [{
            label: 'Seats Won',
            data: seats,
            backgroundColor: colors
        }],
        {
            plugins: {
                title: {
                    display: true,
                    text: `Party Performance in ${data.year}`
                }
            }
        }
    );
}

/**
 * Update constituencies table with top 10 by margin
 * @param {Object} data - Election data
 */
function updateConstituenciesTable(data) {
    const tableBody = document.querySelector('#constituenciesTable tbody');
    
    if (!data || !data.constituencies || data.constituencies.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No data available</td></tr>';
        return;
    }
    
    // Sort constituencies by margin and get top 10
    const topConstituencies = [...data.constituencies]
        .filter(c => c.margin_percent) // Filter out entries without margin data
        .sort((a, b) => {
            const marginA = parseFloat(a.margin_percent);
            const marginB = parseFloat(b.margin_percent);
            return marginB - marginA;
        })
        .slice(0, 10);
    
    let html = '';
    
    topConstituencies.forEach((constituency, index) => {
        html += `
            <tr>
                <td><a href="constituency.html?name=${encodeURIComponent(constituency.constituency)}">${constituency.constituency}</a></td>
                <td>${constituency.state || 'N/A'}</td>
                <td>${constituency.winner || 'N/A'}</td>
                <td>${utils.createPartyBadge(constituency.party, index)}</td>
                <td>${constituency.margin_percent || 'N/A'}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

/**
 * Update turnout chart
 * @param {string} selectedYear - Currently selected year
 */
async function updateTurnoutChart(selectedYear) {
    try {
        // Fetch turnout data for all years
        const turnoutData = await utils.fetchData('turnout');
        
        if (!turnoutData || !turnoutData.years || turnoutData.years.length === 0) {
            console.error('No turnout data available');
            return;
        }
        
        // Destroy previous chart if it exists
        if (turnoutChart) {
            charts.destroyChart(turnoutChart);
        }
        
        // Create new chart
        turnoutChart = charts.createLineChart(
            'turnoutChart',
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
                        text: 'Voter Turnout Trend Over Elections'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: Math.max(0, Math.min(...turnoutData.avg_turnout) - 5),
                        max: Math.min(100, Math.max(...turnoutData.avg_turnout) + 5)
                    }
                }
            }
        );
        
    } catch (error) {
        console.error('Error updating turnout chart:', error);
    }
}

/**
 * Update win margin distribution chart
 * @param {Object} data - Election data
 */
function updateMarginDistChart(data) {
    if (!data || !data.constituencies || data.constituencies.length === 0) {
        return;
    }
    
    // Create margin distribution buckets
    const margins = {
        'Very Close (< 1%)': 0,
        'Close (1-5%)': 0,
        'Moderate (5-10%)': 0,
        'Comfortable (10-20%)': 0,
        'Landslide (> 20%)': 0
    };
    
    // Count seats in each margin bucket
    data.constituencies.forEach(constituency => {
        if (constituency.margin_percent) {
            const margin = parseFloat(constituency.margin_percent);
            
            if (margin < 1) {
                margins['Very Close (< 1%)']++;
            } else if (margin < 5) {
                margins['Close (1-5%)']++;
            } else if (margin < 10) {
                margins['Moderate (5-10%)']++;
            } else if (margin < 20) {
                margins['Comfortable (10-20%)']++;
            } else {
                margins['Landslide (> 20%)']++;
            }
        }
    });
    
    const labels = Object.keys(margins);
    const values = Object.values(margins);
    const colors = [
        '#d32f2f', // Very close - Red
        '#ff5722', // Close - Deep Orange
        '#ffc107', // Moderate - Amber
        '#4caf50', // Comfortable - Green
        '#2196f3'  // Landslide - Blue
    ];
    
    // Destroy previous chart if it exists
    if (marginDistChart) {
        charts.destroyChart(marginDistChart);
    }
    
    // Create new chart
    marginDistChart = charts.createPieChart(
        'marginDistChart',
        labels,
        values,
        colors,
        {
            plugins: {
                title: {
                    display: true,
                    text: `Win Margin Distribution (${data.year})`
                }
            }
        }
    );
}

/**
 * Update state-wise seat distribution chart
 * @param {Object} data - Election data
 */
function updateStateChart(data) {
    if (!data || !data.constituencies || data.constituencies.length === 0) {
        return;
    }
    
    // Count seats by state
    const stateSeats = {};
    data.constituencies.forEach(constituency => {
        if (constituency.state) {
            if (!stateSeats[constituency.state]) {
                stateSeats[constituency.state] = 0;
            }
            stateSeats[constituency.state]++;
        }
    });
    
    // Get top 10 states by seat count
    const topStates = Object.entries(stateSeats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const labels = topStates.map(state => state[0]);
    const seats = topStates.map(state => state[1]);
    
    // Generate a color gradient for the states
    const colors = [];
    for (let i = 0; i < labels.length; i++) {
        const hue = 200 + (i * 15) % 160; // Range from 200 to 360 (blue to red)
        colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    
    // Destroy previous chart if it exists
    if (stateChart) {
        charts.destroyChart(stateChart);
    }
    
    // Create new chart
    stateChart = charts.createHorizontalBarChart(
        'stateChart',
        labels,
        [{
            label: 'Number of Constituencies',
            data: seats,
            backgroundColor: colors
        }],
        {
            plugins: {
                title: {
                    display: true,
                    text: `Top 10 States by Number of Constituencies (${data.year})`
                }
            }
        }
    );
}
