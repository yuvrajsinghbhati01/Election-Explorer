// script.js - Frontend JavaScript for Lok Sabha Election Explorer

// Base URL for API calls - use the value from config.js
const API_BASE_URL = CONFIG.API_BASE_URL + '/api';

// Document ready function
$(document).ready(function() {
    // Fetch initial data to populate dropdowns
    fetchInitialData();

    // Set up form submission handlers
    $('#resultForm').on('submit', function(e) {
        e.preventDefault();
        findResults();
    });

    $('#trendForm').on('submit', function(e) {
        e.preventDefault();
        showTrend();
    });

    $('#compareForm').on('submit', function(e) {
        e.preventDefault();
        compareParties();
    });

    $('#statePartyTrendForm').on('submit', function(e) {
        e.preventDefault();
        showStatePartyTrend();
    });



    // Handle state selection change for party dropdown filtering
    $('#stateTrend').on('change', function() {
        const selectedState = $(this).val();
        if (selectedState) {
            fetchPartiesForState(selectedState);
        }
    });
});

// Fetch initial data for dropdowns
function fetchInitialData() {
    // Fetch years
    fetch(`${API_BASE_URL}/years`)
        .then(response => response.json())
        .then(years => {
            if (Array.isArray(years)) {
                populateDropdown('year', years);
            }
        })
        .catch(error => {
            console.error('Error fetching years:', error);
        });

    // Fetch constituencies
    fetch(`${API_BASE_URL}/constituencies`)
        .then(response => response.json())
        .then(constituencies => {
            if (Array.isArray(constituencies)) {
                populateDropdown('constituency', constituencies);
            }
        })
        .catch(error => {
            console.error('Error fetching constituencies:', error);
        });

    // Fetch parties
    fetch(`${API_BASE_URL}/parties`)
        .then(response => response.json())
        .then(parties => {
            if (Array.isArray(parties)) {
                populateDropdown('party', parties);
            }
        })
        .catch(error => {
            console.error('Error fetching parties:', error);
        });

    // Fetch states
    fetchStates();
}

// Fetch states for dropdown if not included in initial data
function fetchStates() {
    fetch(`${API_BASE_URL}/states`)
        .then(response => response.json())
        .then(states => {
            if (Array.isArray(states)) {
                populateDropdown('stateTrend', states);
            }
        })
        .catch(error => {
            console.error('Error fetching states:', error);
        });
}

// Populate dropdown elements
function populateDropdown(id, options) {
    const dropdown = $(`#${id}`);
    dropdown.empty();
    dropdown.append('<option value="">Select an option</option>');

    options.forEach(option => {
        dropdown.append(`<option value="${option}">${option}</option>`);
    });

    // If this is the party dropdown, also populate the other party dropdowns
    if (id === 'party') {
        // Store all parties for search functionality
        window.allParties = options;

        // Initialize all five party dropdowns
        const partyDropdowns = [
            $('#party1'),
            $('#party2'),
            $('#party3'),
            $('#party4'),
            $('#party5')
        ];

        // Clear and initialize all dropdowns
        partyDropdowns.forEach(dropdown => {
            dropdown.empty();
            dropdown.append('<option value="">Select a party</option>');

            // Add all parties to each dropdown
            options.forEach(party => {
                dropdown.append(`<option value="${party}">${party}</option>`);
            });
        });

        // Set up party search functionality
        $('#partySearch').on('input', function() {
            const searchTerm = $(this).val().toLowerCase();

            if (searchTerm.length > 0) {
                const filteredParties = window.allParties.filter(party =>
                    party.toLowerCase().includes(searchTerm)
                );

                // Update dropdowns with filtered results
                updatePartyDropdowns(filteredParties);
            } else {
                // If search is cleared, show all parties
                updatePartyDropdowns(window.allParties);
            }
        });
    }
}

// Helper function to update party dropdowns with filtered results
function updatePartyDropdowns(parties) {
    // Get all party dropdowns
    const partyDropdowns = [
        { element: $('#party1'), required: true },
        { element: $('#party2'), required: true },
        { element: $('#party3'), required: false },
        { element: $('#party4'), required: false },
        { element: $('#party5'), required: false }
    ];

    // Process each dropdown
    partyDropdowns.forEach(dropdown => {
        const element = dropdown.element;

        // Save current selection
        const currentSelection = element.val();

        // Clear dropdown
        element.empty();

        // Add default option
        element.append('<option value="">Select a party</option>');

        // Add filtered parties
        parties.forEach(party => {
            element.append(`<option value="${party}">${party}</option>`);
        });

        // Restore selection if it exists in the filtered list
        if (currentSelection && parties.includes(currentSelection)) {
            element.val(currentSelection);
        }
    });
}

// Find election results
function findResults() {
    const year = $('#year').val();
    const constituency = $('#constituency').val();

    if (!year || !constituency) {
        alert('Please select both year and constituency');
        return;
    }

    // Show loading indicator
    console.log(`Finding results for ${constituency} in ${year}...`);

    // Prepare request data
    const requestData = {
        year: year,
        constituency: constituency
    };

    // Send GET request to constituency API
    fetch(`${API_BASE_URL}/constituency/${encodeURIComponent(constituency)}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Result data received:', data);

        // Check if we have results
        if (!data.results || data.results.length === 0) {
            alert(`No results found for ${constituency}.`);
            return;
        }

        // Filter results for the selected year
        const yearResult = data.results.find(result => result.year === year);

        if (!yearResult) {
            alert(`No results found for ${constituency} in ${year}.`);
            return;
        }

        // Find the next best candidate (if available) for the runner-up
        // This would require additional data that's not currently available

        // Create a new window to show results
        const resultWindow = window.open('', '_blank');
        resultWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Election Results: ${constituency} (${year})</title>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css">
                <style>
                    body { font-family: Arial, sans-serif; }
                    .winner { border-color: #28a745; }
                    .runner-up { border-color: #17a2b8; }
                    .result-container { margin-bottom: 30px; }
                </style>
            </head>
            <body>
                <div class="container mt-4">
                    <div class="row">
                        <div class="col-md-12">
                            <h2>Election Results: ${constituency} (${year})</h2>
                            <div class="result-container">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="card winner mb-4">
                                            <div class="card-header bg-success text-white">
                                                Winner
                                            </div>
                                            <div class="card-body">
                                                <h5 class="card-title">${yearResult.winner || 'N/A'}</h5>
                                                <p class="card-text">Party: ${yearResult.party || 'N/A'}</p>
                                                <p class="card-text">Votes: ${yearResult.votes || 'N/A'}</p>
                                                <p class="card-text">Margin: ${yearResult.margin || 'N/A'} (${yearResult.margin_percent || 'N/A'})</p>
                                                <p class="card-text">Turnout: ${yearResult.turnout || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <h4>Results for All Years</h4>
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>Year</th>
                                                <th>Winner</th>
                                                <th>Party</th>
                                                <th>Votes</th>
                                                <th>Margin</th>
                                                <th>Turnout</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${data.results.map(result => `
                                                <tr ${result.year === year ? 'class="table-success"' : ''}>
                                                    <td><strong>${result.year}</strong></td>
                                                    <td>${result.winner || 'N/A'}</td>
                                                    <td>${result.party || 'N/A'}</td>
                                                    <td>${result.votes || 'N/A'}</td>
                                                    <td>${result.margin || 'N/A'} (${result.margin_percent || 'N/A'})</td>
                                                    <td>${result.turnout || 'N/A'}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>

                                <div class="text-center mt-4">
                                    <button class="btn btn-primary" onclick="window.close()">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
        resultWindow.document.close();
    })
    .catch(error => {
        console.error('Error fetching results:', error);
        alert('Failed to retrieve election results. Please try again.');
    });
}

// Show party trend
function showTrend() {
    const party = $('#party').val();

    if (!party) {
        alert('Please select a party');
        return;
    }

    // Show loading indicator
    console.log(`Finding trend for ${party}...`);

    // Prepare request data
    const requestData = {
        party: party
    };

    // Send GET request to party API
    fetch(`${API_BASE_URL}/party/${encodeURIComponent(party)}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Trend data received:', data);

        // Check if we have data
        if (!data.performance || data.performance.length === 0) {
            alert(`No performance data found for ${party}.`);
            return;
        }

        // Extract years and seats data
        const years = data.performance.map(p => p.year);
        const seatsWon = data.performance.map(p => p.seats_won);
        const percentages = data.performance.map(p => p.percentage);

        // Create a new window to show trend
        const trendWindow = window.open('', '_blank');
        trendWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Party Performance: ${party}</title>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css">
                <style>
                    body { font-family: Arial, sans-serif; }
                    .trend-container { margin-bottom: 30px; }
                </style>
                <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            </head>
            <body>
                <div class="container mt-4">
                    <div class="row">
                        <div class="col-md-12">
                            <h2>Performance Trend: ${party}</h2>
                            <div class="trend-container">
                                <div class="card mb-4">
                                    <div class="card-header bg-primary text-white">
                                        <h4>Seats Won by Year</h4>
                                    </div>
                                    <div class="card-body">
                                        <div id="seatsChart" style="width:100%; height:400px;"></div>
                                    </div>
                                </div>

                                <div class="card mb-4">
                                    <div class="card-header bg-info text-white">
                                        <h4>Vote Share Percentage</h4>
                                    </div>
                                    <div class="card-body">
                                        <div id="percentageChart" style="width:100%; height:400px;"></div>
                                    </div>
                                </div>

                                <h4>Performance by Year</h4>
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>Year</th>
                                                <th>Seats Won</th>
                                                <th>Total Seats</th>
                                                <th>Percentage</th>
                                                <th>Constituencies</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${data.performance.map(perf => `
                                                <tr>
                                                    <td><strong>${perf.year}</strong></td>
                                                    <td>${perf.seats_won}</td>
                                                    <td>${perf.total_seats}</td>
                                                    <td>${perf.percentage}%</td>
                                                    <td>${perf.constituencies.length} constituencies</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>

                                <div class="text-center mt-4">
                                    <button class="btn btn-primary" onclick="window.close()">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        // Create seats chart
                        Plotly.newPlot('seatsChart', [{
                            x: ${JSON.stringify(years)},
                            y: ${JSON.stringify(seatsWon)},
                            type: 'scatter',
                            mode: 'lines+markers',
                            marker: {
                                size: 10,
                                color: '#007bff'
                            },
                            line: {
                                color: '#007bff',
                                width: 2
                            }
                        }], {
                            title: 'Seats Won by ${party} (1952-2024)',
                            xaxis: {
                                title: 'Election Year'
                            },
                            yaxis: {
                                title: 'Number of Seats'
                            }
                        });

                        // Create percentage chart
                        Plotly.newPlot('percentageChart', [{
                            x: ${JSON.stringify(years)},
                            y: ${JSON.stringify(percentages)},
                            type: 'scatter',
                            mode: 'lines+markers',
                            marker: {
                                size: 10,
                                color: '#17a2b8'
                            },
                            line: {
                                color: '#17a2b8',
                                width: 2
                            }
                        }], {
                            title: 'Vote Share Percentage of ${party} (1952-2024)',
                            xaxis: {
                                title: 'Election Year'
                            },
                            yaxis: {
                                title: 'Percentage (%)'
                            }
                        });
                    });
                </script>
            </body>
            </html>
        `);
        trendWindow.document.close();
    })
    .catch(error => {
        console.error('Error fetching trend:', error);
        alert('Failed to retrieve party trend. Please try again.');
    });
}

// Compare multiple parties
function compareParties() {
    // Get parties from all five dropdowns
    const selectedParties = [];

    // Check all dropdowns (required and optional)
    const partyDropdowns = [
        $('#party1'),
        $('#party2'),
        $('#party3'),
        $('#party4'),
        $('#party5')
    ];

    // Add values from dropdowns, avoiding duplicates
    partyDropdowns.forEach(dropdown => {
        const party = dropdown.val();
        if (party && !selectedParties.includes(party)) {
            selectedParties.push(party);
        }
    });

    // Need at least 2 parties to compare
    if (selectedParties.length < 2) {
        alert('Please select at least two parties to compare');
        return;
    }

    // Maximum of 5 parties for performance reasons
    if (selectedParties.length > 5) {
        alert('Please select a maximum of 5 parties to compare');
        return;
    }

    // Show loading indicator
    console.log(`Comparing parties: ${selectedParties.join(', ')}...`);

    // Prepare request data
    const requestData = {
        parties: selectedParties
    };

    // Send GET request to compare/parties API with query parameters
    const queryParams = selectedParties.map(party => `parties=${encodeURIComponent(party)}`).join('&');
    fetch(`${API_BASE_URL}/compare/parties?${queryParams}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Comparison data received:', data);

        // Extract data for the chart
        const parties = selectedParties;
        const years = data.data ? data.data.map(item => item.year) : [];

        // Create party seat data
        const partySeats = {};
        parties.forEach(party => {
            partySeats[party] = [];
        });

        // Fill in the seat data for each party by year
        if (data.data) {
            data.data.forEach(yearData => {
                const year = yearData.year;
                const partySeatsForYear = yearData.party_seats || {};

                // For each party, add the seats for this year
                parties.forEach(party => {
                    const seats = partySeatsForYear[party] || 0;
                    partySeats[party].push(seats);
                });
            });
        }

        // Create a new window to show comparison
        const comparisonWindow = window.open('', '_blank');
        comparisonWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Party Comparison</title>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css">
                <style>
                    body { font-family: Arial, sans-serif; }
                    .trend-container { margin-bottom: 30px; }
                </style>
                <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            </head>
            <body>
                <div class="container mt-4">
                    <div class="row">
                        <div class="col-md-12">
                            <h2>Party Performance Comparison</h2>
                            <div class="trend-container">
                                <div class="card mb-4">
                                    <div class="card-header bg-primary text-white">
                                        <h4>Seats Won by Party</h4>
                                    </div>
                                    <div class="card-body">
                                        <div id="seatsChart" style="width:100%; height:500px;"></div>
                                    </div>
                                </div>

                                <h4>Party Performance Data</h4>
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>Year</th>
                                                ${parties.map(party => `<th>${party}</th>`).join('')}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${years.map((year, index) => `
                                                <tr>
                                                    <td><strong>${year}</strong></td>
                                                    ${parties.map(party => `<td>${partySeats[party][index] || 0}</td>`).join('')}
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>

                                <div class="text-center mt-4">
                                    <button class="btn btn-primary" onclick="window.close()">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        // Colors for party charts
                        const colors = [
                            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
                            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
                        ];

                        // Create traces for each party
                        const traces = ${JSON.stringify(parties)}.map((party, index) => ({
                            x: ${JSON.stringify(years)},
                            y: ${JSON.stringify(partySeats)}[party],
                            type: 'scatter',
                            mode: 'lines+markers',
                            name: party,
                            line: {
                                color: colors[index % colors.length],
                                width: 2
                            },
                            marker: {
                                size: 10,
                                color: colors[index % colors.length]
                            }
                        }));

                        // Create the chart
                        Plotly.newPlot('seatsChart', traces, {
                            title: 'Seats Won by Party (1952-2024)',
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
                    });
                </script>
            </body>
            </html>
        `);
        comparisonWindow.document.close();
    })
    .catch(error => {
        console.error('Error comparing parties:', error);
        alert('Failed to compare parties. Please try again.');
    });
}

// Fetch parties for a specific state
function fetchPartiesForState(state) {
    if (!state) return;

    console.log(`Fetching parties for state: ${state}`);
    fetch(`${API_BASE_URL}/state-party-trends?state=${encodeURIComponent(state)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Received parties data:', data);
            if (data.parties && Array.isArray(data.parties)) {
                const partyDropdown = $('#partyTrend');
                partyDropdown.empty();
                partyDropdown.append('<option value="">All parties</option>');

                data.parties.forEach(party => {
                    partyDropdown.append(`<option value="${party}">${party}</option>`);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching parties for state:', error);
        });
}

// Show state-wise party trend
function showStatePartyTrend() {
    const state = $('#stateTrend').val();
    const party = $('#partyTrend').val();

    if (!state) {
        alert('Please select a state');
        return;
    }

    console.log(`Showing trends for state: ${state}, party: ${party || 'All parties'}`);

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

            // Create a new window to show the trend
            const trendWindow = window.open('', '_blank');
            trendWindow.document.write(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>State-Party Trends: ${state}</title>
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css">
                    <link rel="stylesheet" href="style.css">
                    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
                </head>
                <body>
                    <div class="container mt-4">
                        <div class="row">
                            <div class="col-md-12">
                                <h2>State-Party Analysis: ${state}</h2>
                                <h4>${party ? `Performance of ${party}` : 'Performance of Major Parties'}</h4>

                                <div class="trend-container">
                                    <div class="card mb-4">
                                        <div class="card-header bg-primary text-white">
                                            <h4>Seats Won Trends</h4>
                                        </div>
                                        <div class="card-body">
                                            <div id="seatsChart" style="width:100%; height:400px;"></div>
                                        </div>
                                    </div>

                                    <div class="card mb-4">
                                        <div class="card-header bg-info text-white">
                                            <h4>Vote Share Trends</h4>
                                        </div>
                                        <div class="card-body">
                                            <div id="voteShareChart" style="width:100%; height:400px;"></div>
                                        </div>
                                    </div>

                                    <h4>Party Performance Data</h4>
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

                                    <div class="text-center mt-4">
                                        <button class="btn btn-primary" onclick="window.close()">Close</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <script>
                        // Generate Plotly.js charts
                        document.addEventListener('DOMContentLoaded', function() {
                            // Party colors (assign colors consistently to parties)
                            const colorMap = {};
                            const colors = [
                                '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
                                '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
                                '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'
                            ];

                            // Assign colors to parties
                            Object.keys(${JSON.stringify(data.seat_trends)}).forEach((party, index) => {
                                colorMap[party] = colors[index % colors.length];
                            });

                            // Prepare seats chart data
                            const seatsTraces = Object.keys(${JSON.stringify(data.seat_trends)}).map(party => ({
                                x: ${JSON.stringify(data.years)},
                                y: ${JSON.stringify(data.seat_trends)}[party],
                                type: 'scatter',
                                mode: 'lines+markers',
                                name: party,
                                line: {
                                    color: colorMap[party],
                                    width: 2
                                },
                                marker: {
                                    size: 8,
                                    color: colorMap[party]
                                }
                            }));

                            // Create seats chart
                            Plotly.newPlot('seatsChart', seatsTraces, {
                                title: 'Seats Won by Party in ${state} (1952-2024)',
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

                            // Prepare vote share chart data
                            const voteShareTraces = Object.keys(${JSON.stringify(data.vote_share_trends)}).map(party => ({
                                x: ${JSON.stringify(data.years)},
                                y: ${JSON.stringify(data.vote_share_trends)}[party],
                                type: 'scatter',
                                mode: 'lines+markers',
                                name: party,
                                line: {
                                    color: colorMap[party],
                                    width: 2
                                },
                                marker: {
                                    size: 8,
                                    color: colorMap[party]
                                }
                            }));

                            // Create vote share chart
                            Plotly.newPlot('voteShareChart', voteShareTraces, {
                                title: 'Vote Share by Party in ${state} (1952-2024)',
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
                        });
                    </script>
                </body>
                </html>
            `);
            trendWindow.document.close();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load state-party trends. Please try again.');
        });
}

// Analyze constituency types
function analyzeConstituencyTypes() {
    const constituencyType = $('#constituencyType').val();
    console.log(`Analyzing constituency type: ${constituencyType || 'All types'}`);

    let url = `${API_BASE_URL}/constituency-types`;
    if (constituencyType) {
        url += `?type=${encodeURIComponent(constituencyType)}`;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Constituency type data received:', data);

            // Create a new window to show the analysis
            const analysisWindow = window.open('', '_blank');
            analysisWindow.document.write(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Constituency Type Analysis</title>
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css">
                    <link rel="stylesheet" href="style.css">
                    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
                    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
                    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.bundle.min.js"></script>
                </head>
                <body>
                    <div class="container mt-4">
                        <div class="row">
                            <div class="col-md-12">
                                <h2>Constituency Type Analysis</h2>
                                <h4>${constituencyType ? `Type: ${constituencyType}` : 'All Constituency Types'}</h4>

                                <ul class="nav nav-tabs mb-4" id="typeTabs" role="tablist">
                                    ${data.types.map((type, index) => `
                                        <li class="nav-item">
                                            <a class="nav-link ${index === 0 ? 'active' : ''}"
                                               id="${type}-tab"
                                               data-toggle="tab"
                                               href="#${type}"
                                               role="tab">${type}</a>
                                        </li>
                                    `).join('')}
                                </ul>

                                <div class="tab-content">
                                    ${data.types.map((type, index) => `
                                        <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" id="${type}" role="tabpanel">
                                            <div class="card mb-4">
                                                <div class="card-header bg-primary text-white">
                                                    <h4>Number of ${type} Seats per Election</h4>
                                                </div>
                                                <div class="card-body">
                                                    <div id="seatsChart-${type}" style="width:100%; height:400px;"></div>
                                                </div>
                                            </div>

                                            <div class="card mb-4">
                                                <div class="card-header bg-info text-white">
                                                    <h4>Voter Turnout for ${type} Constituencies</h4>
                                                </div>
                                                <div class="card-body">
                                                    <div id="turnoutChart-${type}" style="width:100%; height:400px;"></div>
                                                </div>
                                            </div>

                                            <div class="card mb-4">
                                                <div class="card-header bg-success text-white">
                                                    <h4>Party Performance in ${type} Constituencies</h4>
                                                </div>
                                                <div class="card-body">
                                                    <div id="partyChart-${type}" style="width:100%; height:400px;"></div>
                                                </div>
                                            </div>

                                            <h4>Performance Data for ${type} Constituencies</h4>
                                            <div class="table-responsive">
                                                <table class="table table-striped table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Election Year</th>
                                                            <th>Number of Seats</th>
                                                            <th>Average Turnout</th>
                                                            <th>Leading Party</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${data.years.map((year, i) => {
                                                            // Find leading party for this year
                                                            let leadingParty = '';
                                                            let maxSeats = 0;

                                                            Object.entries(data.data[type].party_performance).forEach(([party, seats]) => {
                                                                if (seats[i] > maxSeats) {
                                                                    maxSeats = seats[i];
                                                                    leadingParty = party;
                                                                }
                                                            });

                                                            return `
                                                                <tr>
                                                                    <td><strong>${year}</strong></td>
                                                                    <td>${data.data[type].seats_by_year[i] || 0}</td>
                                                                    <td>${data.data[type].turnout_by_year[i] ? data.data[type].turnout_by_year[i].toFixed(2) + '%' : 'N/A'}</td>
                                                                    <td>${leadingParty ? `${leadingParty} (${maxSeats} seats)` : 'N/A'}</td>
                                                                </tr>
                                                            `;
                                                        }).join('')}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>

                                <div class="text-center mt-4 mb-4">
                                    <button class="btn btn-primary" onclick="window.close()">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <script>
                        document.addEventListener('DOMContentLoaded', function() {
                            // Colors for party charts
                            const colors = [
                                '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
                                '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
                                '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'
                            ];

                            // Create charts for each type
                            ${data.types.map(type => `
                                // Seats chart for ${type}
                                Plotly.newPlot('seatsChart-${type}', [{
                                    x: ${JSON.stringify(data.years)},
                                    y: ${JSON.stringify(data.data[type].seats_by_year)},
                                    type: 'bar',
                                    marker: {
                                        color: '#007bff'
                                    }
                                }], {
                                    title: 'Number of ${type} Constituency Seats (1952-2024)',
                                    xaxis: {
                                        title: 'Election Year'
                                    },
                                    yaxis: {
                                        title: 'Number of Seats'
                                    }
                                });

                                // Turnout chart for ${type}
                                Plotly.newPlot('turnoutChart-${type}', [{
                                    x: ${JSON.stringify(data.years)},
                                    y: ${JSON.stringify(data.data[type].turnout_by_year)},
                                    type: 'scatter',
                                    mode: 'lines+markers',
                                    line: {
                                        color: '#17a2b8',
                                        width: 2
                                    },
                                    marker: {
                                        size: 8,
                                        color: '#17a2b8'
                                    }
                                }], {
                                    title: 'Average Voter Turnout in ${type} Constituencies (1952-2024)',
                                    xaxis: {
                                        title: 'Election Year'
                                    },
                                    yaxis: {
                                        title: 'Turnout (%)'
                                    }
                                });

                                // Party performance chart for ${type}
                                const partyTraces = Object.entries(${JSON.stringify(data.data[type].party_performance)})
                                    .filter(([party, seats]) => Math.max(...seats) >= 5) // Only include parties with at least 5 seats
                                    .slice(0, 10) // Limit to top 10 parties
                                    .map(([party, seats], index) => ({
                                        x: ${JSON.stringify(data.years)},
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
                                    }));

                                Plotly.newPlot('partyChart-${type}', partyTraces, {
                                    title: 'Party Performance in ${type} Constituencies (Top Parties)',
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
                            `).join('')}
                        });
                    </script>
                </body>
                </html>
            `);
            analysisWindow.document.close();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load constituency type analysis. Please try again.');
        });
}