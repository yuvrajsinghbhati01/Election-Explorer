/**
 * JavaScript for the comparison page
 */

// Store charts for later reference and update
let yearsComparisonChart = null;
let turnoutComparisonChart = null;
let seatSwingChart = null;
let partiesComparisonChart = null;
let partyGrowthChart = null;

// Initialize the page once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load parties for checkboxes
    loadPartiesForComparison();
    
    // Add event listener for year comparison button
    document.getElementById('compareYearsBtn').addEventListener('click', compareSelectedYears);
    
    // Add event listener for party comparison button
    document.getElementById('comparePartiesBtn').addEventListener('click', compareSelectedParties);
});

/**
 * Load all available parties for comparison checkboxes
 */
async function loadPartiesForComparison() {
    try {
        const parties = await utils.fetchData('parties');
        
        if (!parties || parties.length === 0) {
            console.error('No parties data available');
            return;
        }
        
        // Get party trends to find major parties
        const trendsData = await utils.fetchData('party-trends');
        
        // Calculate total seats won by each party across all years
        const partyTotalSeats = {};
        
        if (trendsData && trendsData.parties && trendsData.seat_trends) {
            trendsData.parties.forEach(party => {
                if (trendsData.seat_trends[party]) {
                    partyTotalSeats[party] = trendsData.seat_trends[party].reduce((sum, seats) => sum + seats, 0);
                }
            });
        }
        
        // Sort parties by total seats won
        const sortedParties = Object.entries(partyTotalSeats)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
        
        // If no trend data available, use alphabetical order
        const displayParties = sortedParties.length > 0 ? sortedParties : parties.sort();
        
        // Populate party checkboxes (create rows with 3 parties each)
        const partiesContainer = document.getElementById('partiesCheckboxes');
        partiesContainer.innerHTML = '';
        
        let html = '';
        
        displayParties.forEach((party, index) => {
            if (index % 3 === 0) {
                html += '<div class="col-md-4">';
            }
            
            html += `
                <div class="form-check">
                    <input class="form-check-input party-checkbox" type="checkbox" value="${party}" id="party${index}">
                    <label class="form-check-label" for="party${index}">
                        ${party}
                    </label>
                </div>
            `;
            
            if (index % 3 === 2 || index === displayParties.length - 1) {
                html += '</div>';
            }
        });
        
        partiesContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading parties for comparison:', error);
    }
}

/**
 * Compare selected years
 */
async function compareSelectedYears() {
    // Get selected years
    const selectedYears = [];
    document.querySelectorAll('.year-checkbox:checked').forEach(checkbox => {
        selectedYears.push(checkbox.value);
    });
    
    if (selectedYears.length < 2) {
        alert('Please select at least 2 years to compare');
        return;
    }
    
    try {
        // Show loading state
        document.getElementById('yearsComparisonResults').classList.remove('d-none');
        document.getElementById('yearsComparisonChart').innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        // Fetch comparison data
        const comparisonData = await utils.fetchData('compare/years', { years: selectedYears });
        
        if (!comparisonData || !comparisonData.party_performance) {
            console.error('No comparison data available');
            return;
        }
        
        // Update comparison charts
        updateYearsComparisonChart(comparisonData);
        updateTurnoutComparisonChart(comparisonData);
        updateSeatSwingChart(comparisonData);
        updateYearsComparisonTable(comparisonData);
        
    } catch (error) {
        console.error('Error comparing years:', error);
    }
}

/**
 * Update years comparison chart
 * @param {Object} data - Comparison data
 */
function updateYearsComparisonChart(data) {
    if (!data || !data.party_performance || !data.years || data.years.length === 0) {
        return;
    }
    
    // Get top parties based on total seats across the compared years
    const partyTotalSeats = {};
    
    Object.entries(data.party_performance).forEach(([party, yearData]) => {
        partyTotalSeats[party] = yearData.reduce((total, yearItem) => total + yearItem.seats, 0);
    });
    
    const topParties = Object.entries(partyTotalSeats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(entry => entry[0]);
    
    // Prepare datasets
    const datasets = [];
    const years = data.years;
    
    topParties.forEach((party, index) => {
        const partyData = data.party_performance[party];
        
        // Create a mapping from year to seats for this party
        const yearToSeats = {};
        partyData.forEach(item => {
            yearToSeats[item.year] = item.seats;
        });
        
        // Create dataset with seats for each year
        const seats = years.map(year => yearToSeats[year] || 0);
        
        datasets.push({
            label: party,
            data: seats,
            backgroundColor: utils.getPartyColor(party, index),
            borderColor: utils.getPartyColor(party, index),
            borderWidth: 1
        });
    });
    
    // Destroy previous chart if it exists
    if (yearsComparisonChart) {
        charts.destroyChart(yearsComparisonChart);
    }
    
    // Create new chart
    yearsComparisonChart = charts.createBarChart(
        'yearsComparisonChart',
        years,
        datasets,
        {
            plugins: {
                title: {
                    display: true,
                    text: 'Party Performance Comparison'
                }
            }
        }
    );
}

/**
 * Update turnout comparison chart
 * @param {Object} data - Comparison data
 */
function updateTurnoutComparisonChart(data) {
    if (!data || !data.turnout_comparison || data.turnout_comparison.length === 0) {
        return;
    }
    
    const years = data.turnout_comparison.map(item => item.year);
    const turnouts = data.turnout_comparison.map(item => item.avg_turnout);
    
    // Destroy previous chart if it exists
    if (turnoutComparisonChart) {
        charts.destroyChart(turnoutComparisonChart);
    }
    
    // Create new chart
    turnoutComparisonChart = charts.createBarChart(
        'turnoutComparisonChart',
        years,
        [{
            label: 'Average Turnout (%)',
            data: turnouts,
            backgroundColor: '#4caf50',
            borderColor: '#4caf50',
            borderWidth: 1
        }],
        {
            plugins: {
                title: {
                    display: true,
                    text: 'Voter Turnout Comparison'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: Math.max(0, Math.min(...turnouts) - 5),
                    max: Math.min(100, Math.max(...turnouts) + 5),
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    );
}

/**
 * Update seat swing chart
 * @param {Object} data - Comparison data
 */
function updateSeatSwingChart(data) {
    if (!data || !data.party_performance || !data.years || data.years.length < 2) {
        return;
    }
    
    // Calculate seat swings between consecutive years
    const years = data.years.sort();
    
    // Get top parties based on total seats across the compared years
    const partyTotalSeats = {};
    
    Object.entries(data.party_performance).forEach(([party, yearData]) => {
        partyTotalSeats[party] = yearData.reduce((total, yearItem) => total + yearItem.seats, 0);
    });
    
    const topParties = Object.entries(partyTotalSeats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);
    
    // Prepare datasets
    const swingLabels = [];
    const datasets = [];
    
    // Calculate seat changes between consecutive years
    for (let i = 0; i < years.length - 1; i++) {
        swingLabels.push(`${years[i]} to ${years[i+1]}`);
    }
    
    topParties.forEach((party, index) => {
        const swings = [];
        const partyData = data.party_performance[party];
        
        // Create a mapping from year to seats for this party
        const yearToSeats = {};
        partyData.forEach(item => {
            yearToSeats[item.year] = item.seats;
        });
        
        // Calculate swings
        for (let i = 0; i < years.length - 1; i++) {
            const seatsYear1 = yearToSeats[years[i]] || 0;
            const seatsYear2 = yearToSeats[years[i+1]] || 0;
            const swing = seatsYear2 - seatsYear1;
            swings.push(swing);
        }
        
        datasets.push({
            label: party,
            data: swings,
            backgroundColor: utils.getPartyColor(party, index),
            borderColor: utils.getPartyColor(party, index),
            borderWidth: 1
        });
    });
    
    // Destroy previous chart if it exists
    if (seatSwingChart) {
        charts.destroyChart(seatSwingChart);
    }
    
    // Create new chart
    seatSwingChart = charts.createBarChart(
        'seatSwingChart',
        swingLabels,
        datasets,
        {
            plugins: {
                title: {
                    display: true,
                    text: 'Seat Swing Analysis'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return `${context.dataset.label}: ${value > 0 ? '+' : ''}${value} seats`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Seat Change'
                    }
                }
            }
        }
    );
}

/**
 * Update years comparison table
 * @param {Object} data - Comparison data
 */
function updateYearsComparisonTable(data) {
    if (!data || !data.party_performance || !data.years || data.years.length === 0) {
        return;
    }
    
    // Sort years chronologically
    const years = [...data.years].sort();
    
    // Get top parties based on total seats across the compared years
    const partyTotalSeats = {};
    
    Object.entries(data.party_performance).forEach(([party, yearData]) => {
        partyTotalSeats[party] = yearData.reduce((total, yearItem) => total + yearItem.seats, 0);
    });
    
    const topParties = Object.entries(partyTotalSeats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(entry => entry[0]);
    
    // Create table header
    const headerRow = document.getElementById('yearsComparisonTableHeader');
    let headerHtml = '<th>Party</th>';
    
    years.forEach(year => {
        headerHtml += `<th>${year}</th>`;
    });
    
    // Add a column for change from first to last year
    if (years.length >= 2) {
        headerHtml += `<th>Change (${years[0]} to ${years[years.length - 1]})</th>`;
    }
    
    headerRow.innerHTML = headerHtml;
    
    // Create table body
    const tableBody = document.getElementById('yearsComparisonTableBody');
    let bodyHtml = '';
    
    topParties.forEach((party, index) => {
        bodyHtml += `<tr><td>${utils.createPartyBadge(party, index)}</td>`;
        
        // Create a mapping from year to seats for this party
        const yearToSeats = {};
        data.party_performance[party].forEach(item => {
            yearToSeats[item.year] = item.seats;
        });
        
        // Add seats for each year
        years.forEach(year => {
            bodyHtml += `<td>${yearToSeats[year] || 0}</td>`;
        });
        
        // Add change column if applicable
        if (years.length >= 2) {
            const firstYearSeats = yearToSeats[years[0]] || 0;
            const lastYearSeats = yearToSeats[years[years.length - 1]] || 0;
            const change = lastYearSeats - firstYearSeats;
            
            let changeClass = '';
            if (change > 0) changeClass = 'text-success';
            else if (change < 0) changeClass = 'text-danger';
            
            bodyHtml += `<td class="${changeClass}">${change > 0 ? '+' : ''}${change}</td>`;
        }
        
        bodyHtml += '</tr>';
    });
    
    tableBody.innerHTML = bodyHtml;
}

/**
 * Compare selected parties
 */
async function compareSelectedParties() {
    // Get selected parties
    const selectedParties = [];
    document.querySelectorAll('.party-checkbox:checked').forEach(checkbox => {
        selectedParties.push(checkbox.value);
    });
    
    if (selectedParties.length < 2) {
        alert('Please select at least 2 parties to compare');
        return;
    }
    
    try {
        // Show loading state
        document.getElementById('partiesComparisonResults').classList.remove('d-none');
        document.getElementById('partiesComparisonChart').innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        // Fetch comparison data
        const comparisonData = await utils.fetchData('compare/parties', { parties: selectedParties });
        
        if (!comparisonData || !comparisonData.data || comparisonData.data.length === 0) {
            console.error('No party comparison data available');
            return;
        }
        
        // Update comparison charts and table
        updatePartiesComparisonChart(comparisonData);
        updatePartyGrowthChart(comparisonData);
        updatePartiesComparisonTable(comparisonData);
        
    } catch (error) {
        console.error('Error comparing parties:', error);
    }
}

/**
 * Update parties comparison chart
 * @param {Object} data - Comparison data
 */
function updatePartiesComparisonChart(data) {
    if (!data || !data.data || data.data.length === 0 || !data.parties || data.parties.length === 0) {
        return;
    }
    
    // Get years and sort chronologically
    const years = data.data.map(item => item.year).sort();
    
    // Prepare datasets
    const datasets = [];
    
    data.parties.forEach((party, index) => {
        const partySeats = years.map(year => {
            const yearData = data.data.find(item => item.year === year);
            return yearData ? yearData.party_seats[party] || 0 : 0;
        });
        
        datasets.push({
            label: party,
            data: partySeats,
            backgroundColor: utils.getPartyColor(party, index),
            borderColor: utils.getPartyColor(party, index),
            borderWidth: 1
        });
    });
    
    // Destroy previous chart if it exists
    if (partiesComparisonChart) {
        charts.destroyChart(partiesComparisonChart);
    }
    
    // Create new chart
    partiesComparisonChart = charts.createBarChart(
        'partiesComparisonChart',
        years,
        datasets,
        {
            plugins: {
                title: {
                    display: true,
                    text: 'Party Performance Comparison Across Elections'
                }
            }
        }
    );
}

/**
 * Update party growth chart
 * @param {Object} data - Comparison data
 */
function updatePartyGrowthChart(data) {
    if (!data || !data.data || data.data.length === 0 || !data.parties || data.parties.length === 0) {
        return;
    }
    
    // Get years and sort chronologically
    const years = data.data.map(item => item.year).sort();
    
    // Calculate percentage change relative to first year
    const datasets = [];
    
    data.parties.forEach((party, index) => {
        // Get seats for each year
        const partySeats = years.map(year => {
            const yearData = data.data.find(item => item.year === year);
            return yearData ? yearData.party_seats[party] || 0 : 0;
        });
        
        // Get baseline value (first year with non-zero seats, or first year)
        let baselineIndex = partySeats.findIndex(seats => seats > 0);
        if (baselineIndex === -1) baselineIndex = 0;
        
        const baselineValue = partySeats[baselineIndex];
        
        // Calculate percentage changes
        const growthData = partySeats.map((seats, i) => {
            if (i < baselineIndex) return null; // Skip years before baseline
            if (baselineValue === 0) return seats > 0 ? 100 : 0; // If baseline is 0
            return ((seats - baselineValue) / baselineValue) * 100;
        });
        
        datasets.push({
            label: party,
            data: growthData,
            borderColor: utils.getPartyColor(party, index),
            backgroundColor: `${utils.getPartyColor(party, index)}20`,
            borderWidth: 2,
            fill: false,
            tension: 0.1
        });
    });
    
    // Destroy previous chart if it exists
    if (partyGrowthChart) {
        charts.destroyChart(partyGrowthChart);
    }
    
    // Create new chart
    partyGrowthChart = charts.createLineChart(
        'partyGrowthChart',
        years,
        datasets,
        {
            plugins: {
                title: {
                    display: true,
                    text: 'Party Growth/Decline Trend (% Change)'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            if (value === null) return `${context.dataset.label}: N/A`;
                            return `${context.dataset.label}: ${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Percentage Change'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    );
}

/**
 * Update parties comparison table
 * @param {Object} data - Comparison data
 */
function updatePartiesComparisonTable(data) {
    if (!data || !data.data || data.data.length === 0 || !data.parties || data.parties.length === 0) {
        return;
    }
    
    // Get years and sort chronologically
    const years = data.data.map(item => item.year).sort();
    
    // Create table header
    const tableHeader = document.querySelector('#partiesComparisonTable thead tr');
    let headerHtml = '<th>Year</th>';
    
    data.parties.forEach(party => {
        headerHtml += `<th>${party}</th>`;
    });
    
    tableHeader.innerHTML = headerHtml;
    
    // Create table body
    const tableBody = document.querySelector('#partiesComparisonTable tbody');
    let bodyHtml = '';
    
    years.forEach(year => {
        bodyHtml += `<tr><td>${year}</td>`;
        
        const yearData = data.data.find(item => item.year === year);
        
        data.parties.forEach((party, index) => {
            const seats = yearData ? yearData.party_seats[party] || 0 : 0;
            bodyHtml += `<td>${seats}</td>`;
        });
        
        bodyHtml += '</tr>';
    });
    
    // Add a row for total seats
    bodyHtml += '<tr class="table-secondary"><td><strong>Total</strong></td>';
    
    data.parties.forEach(party => {
        const totalSeats = years.reduce((total, year) => {
            const yearData = data.data.find(item => item.year === year);
            return total + (yearData ? yearData.party_seats[party] || 0 : 0);
        }, 0);
        
        bodyHtml += `<td><strong>${totalSeats}</strong></td>`;
    });
    
    bodyHtml += '</tr>';
    
    tableBody.innerHTML = bodyHtml;
}
