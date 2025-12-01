// State-Party Analysis JavaScript
// Handles analysis of party performance in specific states

// API base URL
const API_BASE_URL = '/api';

// DOM Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up form submission
    document.getElementById('statePartyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        analyzeStateParty();
    });
    
    // Handle state selection change
    document.getElementById('stateTrend').addEventListener('change', function() {
        const selectedState = this.value;
        if (selectedState) {
            loadPartiesForState(selectedState);
        }
    });
    
    // Load states for dropdown
    loadStates();
});

// Load states for dropdown
function loadStates() {
    fetch(`${API_BASE_URL}/states`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(states => {
            const stateDropdown = document.getElementById('stateTrend');
            
            // Sort states alphabetically
            states.sort();
            
            // Add states to dropdown
            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = state;
                stateDropdown.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading states:', error);
            document.getElementById('stateTrend').innerHTML = 
                '<option value="">Error loading states</option>';
        });
}

// Load parties for a specific state
function loadPartiesForState(state) {
    fetch(`${API_BASE_URL}/state-party-trends?state=${encodeURIComponent(state)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const partyDropdown = document.getElementById('partyTrend');
            partyDropdown.innerHTML = '<option value="">All parties</option>';
            
            if (data.parties && Array.isArray(data.parties)) {
                // Sort parties alphabetically
                data.parties.sort();
                
                // Add parties to dropdown
                data.parties.forEach(party => {
                    const option = document.createElement('option');
                    option.value = party;
                    option.textContent = party;
                    partyDropdown.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading parties for state:', error);
            document.getElementById('partyTrend').innerHTML = 
                '<option value="">Error loading parties</option>';
        });
}

// Analyze state-party trends
function analyzeStateParty() {
    const state = document.getElementById('stateTrend').value;
    const party = document.getElementById('partyTrend').value;
    
    if (!state) {
        alert('Please select a state');
        return;
    }
    
    // Show loading indicator
    const resultsDiv = document.getElementById('analysisResults');
    resultsDiv.innerHTML = `
        <div class="text-center my-5">
            <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Loading...</span>
            </div>
            <p class="mt-2">Loading state-party analysis data...</p>
        </div>
    `;
    
    let url = `${API_BASE_URL}/state-party-trends?state=${encodeURIComponent(state)}`;
    if (party) {
        url += `&party=${encodeURIComponent(party)}`;
    }
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('State-party trend data received:', data);
            displayStatePartyResults(data, state, party);
        })
        .catch(error => {
            console.error('Error:', error);
            resultsDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i> Failed to load state-party trends. Please try again.
                </div>
            `;
        });
}

// Display state-party analysis results
function displayStatePartyResults(data, state, party) {
    const resultsDiv = document.getElementById('analysisResults');
    
    let html = `
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h4><i class="fas fa-chart-line"></i> ${party ? `${party} in ${state}` : `Party Performance in ${state}`}</h4>
            </div>
            <div class="card-body">
                <div id="seatsChart" style="height:400px;"></div>
            </div>
        </div>
        
        <div class="card mb-4">
            <div class="card-header bg-info text-white">
                <h4><i class="fas fa-chart-pie"></i> ${party ? `${party}'s Vote Share in ${state}` : `Vote Share Distribution in ${state}`}</h4>
            </div>
            <div class="card-body">
                <div id="voteShareChart" style="height:400px;"></div>
            </div>
        </div>
        
        <div class="card mb-4">
            <div class="card-header bg-success text-white">
                <h4><i class="fas fa-table"></i> ${state} Election Data</h4>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Election Year</th>
                                ${Object.keys(data.seat_trends).map(party => `<th>${party} Seats</th>`).join('')}
                                ${Object.keys(data.vote_share_trends).map(party => `<th>${party} Vote %</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.years.map((year, i) => `
                                <tr>
                                    <td><strong>${year}</strong></td>
                                    ${Object.keys(data.seat_trends).map(party => `
                                        <td>${data.seat_trends[party][i] || 0}</td>
                                    `).join('')}
                                    ${Object.keys(data.vote_share_trends).map(party => `
                                        <td>${data.vote_share_trends[party][i] ? data.vote_share_trends[party][i].toFixed(2) + '%' : 'N/A'}</td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
    
    // Create seats chart
    const seatsTraces = Object.entries(data.seat_trends).map(([party, seats], index) => {
        const colors = [
            '#007bff', '#28a745', '#dc3545', '#fd7e14', '#6f42c1',
            '#20c997', '#17a2b8', '#ffc107', '#6c757d', '#e83e8c'
        ];
        return {
            x: data.years,
            y: seats,
            type: 'scatter',
            mode: 'lines+markers',
            name: party,
            line: {
                color: colors[index % colors.length],
                width: 2
            },
            marker: {
                size: 8,
                color: colors[index % colors.length]
            }
        };
    });
    
    Plotly.newPlot('seatsChart', seatsTraces, {
        title: party ? `${party} Seats in ${state} (1952-2024)` : `Party Seats in ${state} (1952-2024)`,
        xaxis: {
            title: 'Election Year'
        },
        yaxis: {
            title: 'Number of Seats'
        },
        legend: {
            orientation: 'h',
            y: -0.2
        },
        hovermode: 'closest'
    });
    
    // Create vote share chart
    const voteShareTraces = Object.entries(data.vote_share_trends).map(([party, voteShare], index) => {
        const colors = [
            '#007bff', '#28a745', '#dc3545', '#fd7e14', '#6f42c1',
            '#20c997', '#17a2b8', '#ffc107', '#6c757d', '#e83e8c'
        ];
        return {
            x: data.years,
            y: voteShare,
            type: 'scatter',
            mode: 'lines+markers',
            name: party,
            line: {
                color: colors[index % colors.length],
                width: 2
            },
            marker: {
                size: 8,
                color: colors[index % colors.length]
            }
        };
    });
    
    Plotly.newPlot('voteShareChart', voteShareTraces, {
        title: party ? `${party}'s Vote Share in ${state} (1952-2024)` : `Party Vote Share in ${state} (1952-2024)`,
        xaxis: {
            title: 'Election Year'
        },
        yaxis: {
            title: 'Vote Share (%)'
        },
        legend: {
            orientation: 'h',
            y: -0.2
        },
        hovermode: 'closest'
    });
}