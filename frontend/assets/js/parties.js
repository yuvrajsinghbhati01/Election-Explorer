/**
 * JavaScript for the party analysis page
 */

// Store charts for later reference and update
let partySeatsChart = null;
let partyVoteShareChart = null;
let partyStateChart = null;
let majorPartiesChart = null;
let allPartiesTable = null;

// Initialize the page once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load parties for the dropdown
    loadParties();
    
    // Add event listener for party selection
    const partySelect = document.getElementById('partySelect');
    partySelect.addEventListener('change', function() {
        if (this.value) {
            loadPartyData(this.value);
        }
    });
    
    // Check if a party was specified in the URL
    const urlParams = utils.getUrlParams();
    if (urlParams.name) {
        // Set the dropdown value and load data
        setTimeout(() => {
            partySelect.value = urlParams.name;
            loadPartyData(urlParams.name);
        }, 500); // Small delay to ensure dropdown is populated
    }
    
    // Load major parties overview data
    loadMajorPartiesData();
    
    // Load all parties data for the table
    loadAllPartiesData();
});

/**
 * Load all available parties
 */
async function loadParties() {
    try {
        const parties = await utils.fetchData('parties');
        
        if (!parties || parties.length === 0) {
            console.error('No parties data available');
            return;
        }
        
        // Populate party dropdown
        const partySelect = document.getElementById('partySelect');
        partySelect.innerHTML = '<option value="" selected disabled>Select a party...</option>';
        
        parties.sort().forEach(party => {
            const option = document.createElement('option');
            option.value = party;
            option.textContent = party;
            partySelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading parties:', error);
    }
}

/**
 * Load data for the selected party
 * @param {string} partyName - Name of the selected party
 */
async function loadPartyData(partyName) {
    try {
        // Show party detail and hide overview
        document.getElementById('partyDetail').classList.remove('d-none');
        document.getElementById('partyOverview').classList.add('d-none');
        
        // Fetch party data
        const partyData = await utils.fetchData(`party/${partyName}`);
        
        if (!partyData || !partyData.performance || partyData.performance.length === 0) {
            console.error('No data available for party:', partyName);
            return;
        }
        
        // Update seats chart
        updatePartySeatsChart(partyData);
        
        // Update vote share chart
        updatePartyVoteShareChart(partyData);
        
        // Update constituencies table
        updatePartyConstituenciesTable(partyData);
        
        // Update state-wise performance chart
        updatePartyStateChart(partyData);
        
    } catch (error) {
        console.error(`Error loading data for party ${partyName}:`, error);
    }
}

/**
 * Update party seats chart
 * @param {Object} data - Party data
 */
function updatePartySeatsChart(data) {
    if (!data || !data.performance || data.performance.length === 0) {
        return;
    }
    
    // Sort performance by year
    const sortedPerformance = [...data.performance].sort((a, b) => a.year - b.year);
    
    const years = sortedPerformance.map(perf => perf.year);
    const seatsWon = sortedPerformance.map(perf => perf.seats_won);
    const totalSeats = sortedPerformance.map(perf => perf.total_seats);
    
    // Destroy previous chart if it exists
    if (partySeatsChart) {
        charts.destroyChart(partySeatsChart);
    }
    
    // Create new chart
    partySeatsChart = charts.createBarChart(
        'partySeatsChart',
        years,
        [
            {
                label: 'Seats Won',
                data: seatsWon,
                backgroundColor: utils.getPartyColor(data.name, 0),
                barPercentage: 0.6,
                order: 1
            },
            {
                label: 'Total Seats',
                data: totalSeats,
                backgroundColor: 'rgba(200, 200, 200, 0.5)',
                borderWidth: 1,
                borderDash: [5, 5],
                type: 'line',
                order: 0
            }
        ],
        {
            plugins: {
                title: {
                    display: true,
                    text: `Seat Performance of ${data.name} (2004-2024)`
                }
            }
        }
    );
}

/**
 * Update party vote share chart
 * @param {Object} data - Party data
 */
function updatePartyVoteShareChart(data) {
    if (!data || !data.performance || data.performance.length === 0) {
        return;
    }
    
    // Sort performance by year
    const sortedPerformance = [...data.performance].sort((a, b) => a.year - b.year);
    
    const years = sortedPerformance.map(perf => perf.year);
    const percentages = sortedPerformance.map(perf => perf.percentage);
    
    // Destroy previous chart if it exists
    if (partyVoteShareChart) {
        charts.destroyChart(partyVoteShareChart);
    }
    
    // Create new chart
    partyVoteShareChart = charts.createLineChart(
        'partyVoteShareChart',
        years,
        [{
            label: 'Percentage of Seats Won',
            data: percentages,
            borderColor: utils.getPartyColor(data.name, 0),
            backgroundColor: `${utils.getPartyColor(data.name, 0)}30`,
            borderWidth: 2,
            fill: true,
            tension: 0.1
        }],
        {
            plugins: {
                title: {
                    display: true,
                    text: `Seat Win Percentage of ${data.name} (2004-2024)`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
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
}

/**
 * Update party constituencies table
 * @param {Object} data - Party data
 */
function updatePartyConstituenciesTable(data) {
    const tableBody = document.querySelector('#partyConstituenciesTable tbody');
    
    if (!data || !data.performance || data.performance.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No data available</td></tr>';
        return;
    }
    
    // Sort performance by year in descending order (latest first)
    const sortedPerformance = [...data.performance].sort((a, b) => b.year - a.year);
    
    let html = '';
    let rowCount = 0;
    
    // Loop through each year's performance
    sortedPerformance.forEach(yearPerf => {
        // Skip years with no constituencies won
        if (!yearPerf.constituencies || yearPerf.constituencies.length === 0) {
            return;
        }
        
        // Sort constituencies alphabetically
        const sortedConstituencies = [...yearPerf.constituencies].sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        
        // Add rows for each constituency
        sortedConstituencies.forEach(constituency => {
            rowCount++;
            if (rowCount <= 100) { // Limit to 100 rows for performance
                html += `
                    <tr>
                        <td>${yearPerf.year}</td>
                        <td><a href="constituency.html?name=${encodeURIComponent(constituency.name)}">${constituency.name}</a></td>
                        <td>${constituency.winner || 'N/A'}</td>
                        <td>${constituency.margin_percent || 'N/A'}</td>
                    </tr>
                `;
            }
        });
    });
    
    if (html === '') {
        html = '<tr><td colspan="4" class="text-center">No constituencies won</td></tr>';
    } else if (rowCount > 100) {
        html += `<tr><td colspan="4" class="text-center">Showing 100 of ${rowCount} constituencies...</td></tr>`;
    }
    
    tableBody.innerHTML = html;
    
    // Initialize DataTable
    if ($.fn.DataTable.isDataTable('#partyConstituenciesTable')) {
        $('#partyConstituenciesTable').DataTable().destroy();
    }
    
    $('#partyConstituenciesTable').DataTable({
        pageLength: 15,
        lengthMenu: [15, 25, 50, 100],
        responsive: true,
        order: [[0, 'desc'], [1, 'asc']]
    });
}

/**
 * Update party state-wise performance chart
 * @param {Object} data - Party data
 */
function updatePartyStateChart(data) {
    if (!data || !data.performance || data.performance.length === 0) {
        return;
    }
    
    // Get the most recent performance data
    const latestPerformance = [...data.performance].sort((a, b) => b.year - a.year)[0];
    
    // If no constituencies won in the latest election
    if (!latestPerformance.constituencies || latestPerformance.constituencies.length === 0) {
        if (partyStateChart) {
            charts.destroyChart(partyStateChart);
        }
        return;
    }
    
    // Count seats by state
    const stateSeats = {};
    latestPerformance.constituencies.forEach(constituency => {
        // Extract state from constituency name or use "Unknown"
        let state = "Unknown";
        
        // Fetch constituency details to get state
        fetchConstituencyState(constituency.name).then(fetchedState => {
            if (fetchedState) {
                if (!stateSeats[fetchedState]) {
                    stateSeats[fetchedState] = 0;
                }
                stateSeats[fetchedState]++;
                
                // Once we've processed all constituencies, update the chart
                if (Object.keys(stateSeats).length === latestPerformance.constituencies.length) {
                    updateStateChart(stateSeats, latestPerformance.year, data.name);
                }
            }
        });
    });
}

/**
 * Fetch state for a constituency
 * @param {string} constituencyName - Name of the constituency
 * @returns {Promise<string>} - State name or undefined
 */
async function fetchConstituencyState(constituencyName) {
    try {
        const constituencyData = await utils.fetchData(`constituency/${constituencyName}`);
        
        if (constituencyData && constituencyData.results && constituencyData.results.length > 0) {
            // Find the most recent result
            const latestResult = [...constituencyData.results].sort((a, b) => b.year - a.year)[0];
            return latestResult.state;
        }
    } catch (error) {
        console.error(`Error fetching state for constituency ${constituencyName}:`, error);
    }
    
    return undefined;
}

/**
 * Update the state chart with state-wise seat data
 * @param {Object} stateSeats - Object with state names as keys and seat counts as values
 * @param {string} year - Election year
 * @param {string} partyName - Party name
 */
function updateStateChart(stateSeats, year, partyName) {
    // Sort states by seat count
    const sortedStates = Object.entries(stateSeats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Limit to top 10 states
    
    const states = sortedStates.map(state => state[0]);
    const seats = sortedStates.map(state => state[1]);
    
    // Generate a color gradient based on the party color
    const baseColor = utils.getPartyColor(partyName, 0);
    const colors = [];
    
    for (let i = 0; i < states.length; i++) {
        const opacity = 1 - (i * 0.05);
        // Convert hex to rgba and adjust opacity
        let r = parseInt(baseColor.slice(1, 3), 16);
        let g = parseInt(baseColor.slice(3, 5), 16);
        let b = parseInt(baseColor.slice(5, 7), 16);
        colors.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
    }
    
    // Destroy previous chart if it exists
    if (partyStateChart) {
        charts.destroyChart(partyStateChart);
    }
    
    // Create new chart
    partyStateChart = charts.createHorizontalBarChart(
        'partyStateChart',
        states,
        [{
            label: 'Seats Won',
            data: seats,
            backgroundColor: colors
        }],
        {
            plugins: {
                title: {
                    display: true,
                    text: `State-wise Performance of ${partyName} (${year})`
                }
            }
        }
    );
}

/**
 * Load data for major parties overview
 */
async function loadMajorPartiesData() {
    try {
        // Fetch party trends
        const trendsData = await utils.fetchData('party-trends');
        
        if (!trendsData || !trendsData.parties || trendsData.parties.length === 0) {
            console.error('No party trends data available');
            return;
        }
        
        // Get top 8 parties based on maximum seats won in any election
        const partyMaxSeats = {};
        
        trendsData.parties.forEach(party => {
            if (trendsData.seat_trends[party]) {
                partyMaxSeats[party] = Math.max(...trendsData.seat_trends[party]);
            }
        });
        
        const topParties = Object.entries(partyMaxSeats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(entry => entry[0]);
        
        // Prepare data for chart
        const datasets = [];
        
        topParties.forEach((party, index) => {
            datasets.push({
                label: party,
                data: trendsData.seat_trends[party],
                borderColor: utils.getPartyColor(party, index),
                backgroundColor: `${utils.getPartyColor(party, index)}50`,
                borderWidth: 2,
                fill: false,
                tension: 0.1
            });
        });
        
        // Create chart
        majorPartiesChart = charts.createLineChart(
            'majorPartiesChart',
            trendsData.years,
            datasets,
            {
                plugins: {
                    title: {
                        display: true,
                        text: 'Major Parties Performance Trend (2004-2024)'
                    }
                }
            }
        );
        
    } catch (error) {
        console.error('Error loading major parties data:', error);
    }
}

/**
 * Load data for all parties table
 */
async function loadAllPartiesData() {
    try {
        const years = await utils.fetchData('years');
        
        if (!years || years.length === 0) {
            console.error('No years data available');
            return;
        }
        
        // Sort years chronologically
        const sortedYears = [...years].sort();
        
        // Create an object to store party data
        const partyData = {};
        
        // Fetch data for each year
        for (const year of sortedYears) {
            const electionData = await utils.fetchData(`election/${year}`);
            
            if (!electionData || !electionData.party_seats) continue;
            
            // Update party data
            for (const [party, seats] of Object.entries(electionData.party_seats)) {
                if (!partyData[party]) {
                    partyData[party] = {
                        total: 0
                    };
                    sortedYears.forEach(y => {
                        partyData[party][y] = 0;
                    });
                }
                
                partyData[party][year] = seats;
                partyData[party].total += seats;
            }
        }
        
        // Prepare table data
        const tableBody = document.querySelector('#allPartiesTable tbody');
        
        // Sort parties by total seats in descending order
        const sortedParties = Object.entries(partyData)
            .sort((a, b) => b[1].total - a[1].total);
        
        let html = '';
        
        sortedParties.forEach((partyEntry, index) => {
            const party = partyEntry[0];
            const data = partyEntry[1];
            
            html += `
                <tr>
                    <td>${utils.createPartyBadge(party, index % 15)}</td>
            `;
            
            // Add cells for each year
            sortedYears.forEach(year => {
                html += `<td>${data[year] || 0}</td>`;
            });
            
            // Add total and action button
            html += `
                    <td>${data.total}</td>
                    <td>
                        <button class="btn btn-sm btn-primary view-party-btn" data-party="${party}">
                            View Details
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        
        // Add event listeners to the view buttons
        document.querySelectorAll('.view-party-btn').forEach(button => {
            button.addEventListener('click', function() {
                const partyName = this.getAttribute('data-party');
                document.getElementById('partySelect').value = partyName;
                loadPartyData(partyName);
            });
        });
        
        // Initialize DataTable
        if ($.fn.DataTable.isDataTable('#allPartiesTable')) {
            allPartiesTable.destroy();
        }
        
        allPartiesTable = $('#allPartiesTable').DataTable({
            pageLength: 15,
            lengthMenu: [15, 25, 50, 100],
            responsive: true,
            order: [[6, 'desc']] // Sort by total seats by default
        });
        
    } catch (error) {
        console.error('Error loading all parties data:', error);
    }
}
