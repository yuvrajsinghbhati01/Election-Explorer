/**
 * JavaScript for the constituency analysis page
 */

// Store charts for later reference and update
let constituencyHistoryChart = null;
let constituencyTurnoutChart = null;
let allConstituenciesTable = null;

// Initialize the page once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load constituencies for the dropdown
    loadConstituencies();
    
    // Add event listener for constituency selection
    const constituencySelect = document.getElementById('constituencySelect');
    constituencySelect.addEventListener('change', function() {
        if (this.value) {
            loadConstituencyData(this.value);
        }
    });
    
    // Add event listener for state filter
    const stateFilter = document.getElementById('stateFilter');
    stateFilter.addEventListener('change', function() {
        filterConstituenciesByState(this.value);
    });
    
    // Check if a constituency was specified in the URL
    const urlParams = utils.getUrlParams();
    if (urlParams.name) {
        // Set the dropdown value and load data
        setTimeout(() => {
            constituencySelect.value = urlParams.name;
            loadConstituencyData(urlParams.name);
        }, 500); // Small delay to ensure dropdown is populated
    }
    
    // Load all constituencies data for the table
    loadAllConstituencies();
});

/**
 * Load all available constituencies
 */
async function loadConstituencies() {
    try {
        const constituencies = await utils.fetchData('constituencies');
        
        if (!constituencies || constituencies.length === 0) {
            console.error('No constituencies data available');
            return;
        }
        
        // Load state list for filter
        loadStates(constituencies);
        
        // Populate constituency dropdown
        const constituencySelect = document.getElementById('constituencySelect');
        constituencySelect.innerHTML = '<option value="" selected disabled>Select a constituency...</option>';
        
        constituencies.sort().forEach(constituency => {
            const option = document.createElement('option');
            option.value = constituency;
            option.textContent = constituency;
            constituencySelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading constituencies:', error);
    }
}

/**
 * Load unique states for the filter dropdown
 * @param {string[]} constituencies - List of constituencies
 */
async function loadStates(constituencies) {
    try {
        // Fetch years to get data from
        const years = await utils.fetchData('years');
        if (!years || years.length === 0) {
            console.error('No years data available');
            return;
        }
        
        // Get the most recent year
        const mostRecentYear = years.sort().reverse()[0];
        
        // Fetch election data for the most recent year
        const electionData = await utils.fetchData(`election/${mostRecentYear}`);
        
        if (!electionData || !electionData.constituencies) {
            console.error('No election data available');
            return;
        }
        
        // Extract unique states
        const states = new Set();
        electionData.constituencies.forEach(constituency => {
            if (constituency.state) {
                states.add(constituency.state);
            }
        });
        
        // Populate state filter dropdown
        const stateFilter = document.getElementById('stateFilter');
        stateFilter.innerHTML = '<option value="all">All States</option>';
        
        Array.from(states).sort().forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateFilter.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading states:', error);
    }
}

/**
 * Load data for the selected constituency
 * @param {string} constituencyName - Name of the selected constituency
 */
async function loadConstituencyData(constituencyName) {
    try {
        // Show constituency detail and hide list section
        document.getElementById('constituencyDetail').classList.remove('d-none');
        document.getElementById('constituencyListSection').classList.add('d-none');
        
        // Fetch constituency data
        const constituencyData = await utils.fetchData(`constituency/${constituencyName}`);
        
        if (!constituencyData || !constituencyData.results || constituencyData.results.length === 0) {
            console.error('No data available for constituency:', constituencyName);
            return;
        }
        
        // Update election history chart
        updateConstituencyHistoryChart(constituencyData);
        
        // Update turnout chart
        updateConstituencyTurnoutChart(constituencyData);
        
        // Update results table
        updateConstituencyResultsTable(constituencyData);
        
    } catch (error) {
        console.error(`Error loading data for constituency ${constituencyName}:`, error);
    }
}

/**
 * Update constituency election history chart
 * @param {Object} data - Constituency data
 */
function updateConstituencyHistoryChart(data) {
    if (!data || !data.results || data.results.length === 0) {
        return;
    }
    
    // Sort results by year
    const sortedResults = [...data.results].sort((a, b) => a.year - b.year);
    
    const years = sortedResults.map(result => result.year);
    const parties = sortedResults.map(result => result.party);
    
    // Create a dataset for each unique party
    const uniqueParties = [...new Set(parties)];
    const datasets = [];
    
    uniqueParties.forEach((party, partyIndex) => {
        const partyData = years.map((year, yearIndex) => {
            return sortedResults[yearIndex].party === party ? 1 : 0;
        });
        
        datasets.push({
            label: party,
            data: partyData,
            backgroundColor: utils.getPartyColor(party, partyIndex),
            barThickness: 30
        });
    });
    
    // Destroy previous chart if it exists
    if (constituencyHistoryChart) {
        charts.destroyChart(constituencyHistoryChart);
    }
    
    // Create new chart
    constituencyHistoryChart = charts.createStackedBarChart(
        'constituencyHistoryChart',
        years,
        datasets,
        {
            plugins: {
                title: {
                    display: true,
                    text: `Election History for ${data.name}`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const party = context.dataset.label;
                            const yearIndex = context.dataIndex;
                            const winner = sortedResults[yearIndex].winner;
                            return party === sortedResults[yearIndex].party ? 
                                `${party}: Won (${winner})` : '';
                        }
                    }
                }
            },
            scales: {
                y: {
                    max: 1,
                    ticks: {
                        callback: function(value) {
                            return value === 1 ? 'Won' : '';
                        }
                    }
                }
            }
        }
    );
}

/**
 * Update constituency turnout chart
 * @param {Object} data - Constituency data
 */
function updateConstituencyTurnoutChart(data) {
    if (!data || !data.results || data.results.length === 0) {
        return;
    }
    
    // Sort results by year
    const sortedResults = [...data.results].sort((a, b) => a.year - b.year);
    
    const years = sortedResults.map(result => result.year);
    const turnouts = sortedResults.map(result => {
        // Extract numeric value from turnout percentage
        const turnoutStr = result.turnout || '0%';
        return parseFloat(turnoutStr.replace('%', ''));
    });
    
    // Destroy previous chart if it exists
    if (constituencyTurnoutChart) {
        charts.destroyChart(constituencyTurnoutChart);
    }
    
    // Create new chart
    constituencyTurnoutChart = charts.createLineChart(
        'constituencyTurnoutChart',
        years,
        [{
            label: 'Voter Turnout (%)',
            data: turnouts,
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
                    text: `Voter Turnout Trend for ${data.name}`
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: Math.max(0, Math.min(...turnouts) - 5),
                    max: Math.min(100, Math.max(...turnouts) + 5)
                }
            }
        }
    );
}

/**
 * Update constituency results table
 * @param {Object} data - Constituency data
 */
function updateConstituencyResultsTable(data) {
    const tableBody = document.querySelector('#constituencyResultsTable tbody');
    
    if (!data || !data.results || data.results.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No data available</td></tr>';
        return;
    }
    
    // Sort results by year in descending order (latest first)
    const sortedResults = [...data.results].sort((a, b) => b.year - a.year);
    
    let html = '';
    
    sortedResults.forEach((result, index) => {
        html += `
            <tr>
                <td>${result.year}</td>
                <td>${result.winner || 'N/A'}</td>
                <td>${utils.createPartyBadge(result.party, index)}</td>
                <td>${result.votes ? utils.formatNumber(result.votes) : 'N/A'}</td>
                <td>${result.margin ? utils.formatNumber(result.margin) : 'N/A'}</td>
                <td>${result.margin_percent || 'N/A'}</td>
                <td>${result.turnout || 'N/A'}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

/**
 * Load all constituencies for the table view
 */
async function loadAllConstituencies() {
    try {
        // Fetch years to get data from
        const years = await utils.fetchData('years');
        if (!years || years.length === 0) {
            console.error('No years data available');
            return;
        }
        
        // Get the most recent year
        const mostRecentYear = years.sort().reverse()[0];
        
        // Fetch election data for the most recent year
        const electionData = await utils.fetchData(`election/${mostRecentYear}`);
        
        if (!electionData || !electionData.constituencies) {
            console.error('No election data available');
            return;
        }
        
        // Get the table and prepare for DataTable initialization
        const tableBody = document.querySelector('#allConstituenciesTable tbody');
        
        let html = '';
        
        // Sort constituencies alphabetically
        const sortedConstituencies = [...electionData.constituencies].sort((a, b) => {
            return a.constituency.localeCompare(b.constituency);
        });
        
        sortedConstituencies.forEach((constituency, index) => {
            html += `
                <tr data-state="${constituency.state || ''}">
                    <td>${constituency.constituency}</td>
                    <td>${constituency.state || 'N/A'}</td>
                    <td>${constituency.type || 'GEN'}</td>
                    <td>${constituency.winner || 'N/A'}</td>
                    <td>${utils.createPartyBadge(constituency.party, index % 15)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary view-btn" data-constituency="${constituency.constituency}">
                            View Details
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        
        // Add event listeners to the view buttons
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', function() {
                const constituencyName = this.getAttribute('data-constituency');
                document.getElementById('constituencySelect').value = constituencyName;
                loadConstituencyData(constituencyName);
            });
        });
        
        // Initialize DataTable
        if ($.fn.DataTable.isDataTable('#allConstituenciesTable')) {
            allConstituenciesTable.destroy();
        }
        
        allConstituenciesTable = $('#allConstituenciesTable').DataTable({
            pageLength: 15,
            lengthMenu: [15, 25, 50, 100],
            responsive: true,
            order: [[0, 'asc']]
        });
        
    } catch (error) {
        console.error('Error loading all constituencies:', error);
    }
}

/**
 * Filter the constituencies table by state
 * @param {string} state - State to filter by, 'all' for all states
 */
function filterConstituenciesByState(state) {
    if (!allConstituenciesTable) {
        return;
    }
    
    if (state === 'all') {
        allConstituenciesTable.search('').columns(1).search('').draw();
    } else {
        allConstituenciesTable.columns(1).search(state).draw();
    }
}
