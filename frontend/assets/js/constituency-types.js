// Constituency Types Analysis JavaScript
// Handles analysis of reserved and general constituency performance

// API base URL
const API_BASE_URL = '/api';

// DOM Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up form submission
    document.getElementById('constituencyTypeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        analyzeConstituencyTypes();
    });
    
    // Load initial distribution chart
    loadTypesDistribution();
});

// Load constituency types distribution chart
function loadTypesDistribution() {
    fetch(`${API_BASE_URL}/constituency-types`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Get the latest election year data for the chart
            const latestYear = data.years[data.years.length - 1];
            const latestYearIndex = data.years.indexOf(latestYear);
            
            // Count seats by type in the latest year
            const typeData = [];
            const typeLabels = [];
            const typeColors = ['#17a2b8', '#dc3545', '#28a745']; // Colors for each type
            
            let index = 0;
            for (const type of data.types) {
                const seatCount = data.data[type].seats_by_year[latestYearIndex] || 0;
                if (seatCount > 0) {
                    typeLabels.push(`${type} (${seatCount} seats)`);
                    typeData.push(seatCount);
                    index++;
                }
            }
            
            // Create the pie chart
            const distributionChart = document.getElementById('typesDistributionChart');
            
            Plotly.newPlot(distributionChart, [{
                values: typeData,
                labels: typeLabels,
                type: 'pie',
                textinfo: 'percent',
                hoverinfo: 'label+value+percent',
                marker: {
                    colors: typeColors
                }
            }], {
                title: `Constituency Types Distribution (${latestYear} Election)`,
                height: 400
            });
        })
        .catch(error => {
            console.error('Error loading constituency types distribution:', error);
            document.getElementById('typesDistributionChart').innerHTML = 
                '<div class="alert alert-danger">Failed to load constituency types distribution data.</div>';
        });
}

// Analyze constituency types
function analyzeConstituencyTypes() {
    const constituencyType = document.getElementById('constituencyType').value;
    console.log(`Analyzing constituency type: ${constituencyType || 'All types'}`);
    
    // Show loading indicator
    const resultsDiv = document.getElementById('analysisResults');
    resultsDiv.innerHTML = `
        <div class="text-center my-5">
            <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Loading...</span>
            </div>
            <p class="mt-2">Loading analysis data...</p>
        </div>
    `;
    
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
            displayAnalysisResults(data, constituencyType);
        })
        .catch(error => {
            console.error('Error:', error);
            resultsDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i> Failed to load constituency type analysis. Please try again.
                </div>
            `;
        });
}

// Display analysis results
function displayAnalysisResults(data, selectedType) {
    const resultsDiv = document.getElementById('analysisResults');
    
    // If no specific type is selected, show summary of all types
    if (!selectedType) {
        displayTypesComparison(data, resultsDiv);
    } else {
        // Show detailed analysis for the selected type
        displaySingleTypeAnalysis(data, selectedType, resultsDiv);
    }
}

// Display comparison of all constituency types
function displayTypesComparison(data, resultsDiv) {
    let html = `
        <div class="card mb-4">
            <div class="card-header bg-success text-white">
                <h4><i class="fas fa-chart-line"></i> Constituency Types Comparison</h4>
            </div>
            <div class="card-body">
                <div id="typesSeatsChart" style="height:400px;"></div>
            </div>
        </div>
        
        <div class="card mb-4">
            <div class="card-header bg-info text-white">
                <h4><i class="fas fa-chart-bar"></i> Voter Turnout Comparison</h4>
            </div>
            <div class="card-body">
                <div id="typesTurnoutChart" style="height:400px;"></div>
            </div>
        </div>
        
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h4><i class="fas fa-table"></i> Constituency Types Data</h4>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Election Year</th>
                                ${data.types.map(type => `<th>${type} Seats</th>`).join('')}
                                ${data.types.map(type => `<th>${type} Turnout</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.years.map((year, i) => `
                                <tr>
                                    <td><strong>${year}</strong></td>
                                    ${data.types.map(type => `
                                        <td>${data.data[type].seats_by_year[i] || 0}</td>
                                    `).join('')}
                                    ${data.types.map(type => `
                                        <td>${data.data[type].turnout_by_year[i] ? data.data[type].turnout_by_year[i].toFixed(2) + '%' : 'N/A'}</td>
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
    
    // Create the seats comparison chart
    const seatsTraces = data.types.map((type, index) => {
        const colors = ['#17a2b8', '#dc3545', '#28a745']; // Colors for each type
        return {
            x: data.years,
            y: data.data[type].seats_by_year,
            type: 'scatter',
            mode: 'lines+markers',
            name: type,
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
    
    Plotly.newPlot('typesSeatsChart', seatsTraces, {
        title: 'Number of Seats by Constituency Type (1952-2024)',
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
    
    // Create the turnout comparison chart
    const turnoutTraces = data.types.map((type, index) => {
        const colors = ['#17a2b8', '#dc3545', '#28a745']; // Colors for each type
        return {
            x: data.years,
            y: data.data[type].turnout_by_year,
            type: 'scatter',
            mode: 'lines+markers',
            name: type,
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
    
    Plotly.newPlot('typesTurnoutChart', turnoutTraces, {
        title: 'Average Voter Turnout by Constituency Type (1952-2024)',
        xaxis: {
            title: 'Election Year'
        },
        yaxis: {
            title: 'Turnout (%)'
        },
        legend: {
            orientation: 'h',
            y: -0.2
        },
        hovermode: 'closest'
    });
}

// Display analysis for a single constituency type
function displaySingleTypeAnalysis(data, selectedType, resultsDiv) {
    // Get the data for the selected type
    const typeData = data.data[selectedType];
    
    // Get top 5 parties for this constituency type
    const partiesPerformance = Object.entries(typeData.party_performance)
        .map(([party, seats]) => ({
            party,
            totalSeats: seats.reduce((sum, count) => sum + count, 0)
        }))
        .sort((a, b) => b.totalSeats - a.totalSeats)
        .slice(0, 5);
    
    let html = `
        <div class="card mb-4">
            <div class="card-header bg-success text-white">
                <h4><i class="fas fa-chart-line"></i> ${selectedType} Constituencies Over Time</h4>
            </div>
            <div class="card-body">
                <div id="typeSeatsChart" style="height:400px;"></div>
            </div>
        </div>
        
        <div class="card mb-4">
            <div class="card-header bg-info text-white">
                <h4><i class="fas fa-users"></i> Top Parties in ${selectedType} Constituencies</h4>
            </div>
            <div class="card-body">
                <div id="typePartiesChart" style="height:400px;"></div>
            </div>
        </div>
        
        <div class="card mb-4">
            <div class="card-header bg-warning text-white">
                <h4><i class="fas fa-chart-bar"></i> Voter Turnout in ${selectedType} Constituencies</h4>
            </div>
            <div class="card-body">
                <div id="typeTurnoutChart" style="height:400px;"></div>
            </div>
        </div>
        
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h4><i class="fas fa-table"></i> ${selectedType} Constituencies Data</h4>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Election Year</th>
                                <th>Number of Seats</th>
                                <th>Average Turnout</th>
                                <th>Leading Party</th>
                                <th>Leading Party Seats</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.years.map((year, i) => {
                                // Find leading party for this year
                                let leadingParty = '';
                                let maxSeats = 0;
                                
                                Object.entries(typeData.party_performance).forEach(([party, seats]) => {
                                    if (seats[i] > maxSeats) {
                                        maxSeats = seats[i];
                                        leadingParty = party;
                                    }
                                });
                                
                                return `
                                    <tr>
                                        <td><strong>${year}</strong></td>
                                        <td>${typeData.seats_by_year[i] || 0}</td>
                                        <td>${typeData.turnout_by_year[i] ? typeData.turnout_by_year[i].toFixed(2) + '%' : 'N/A'}</td>
                                        <td>${leadingParty || 'N/A'}</td>
                                        <td>${maxSeats > 0 ? maxSeats : 'N/A'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
    
    // Create the seats chart
    Plotly.newPlot('typeSeatsChart', [{
        x: data.years,
        y: typeData.seats_by_year,
        type: 'bar',
        marker: {
            color: '#28a745'
        }
    }], {
        title: `Number of ${selectedType} Constituency Seats (1952-2024)`,
        xaxis: {
            title: 'Election Year'
        },
        yaxis: {
            title: 'Number of Seats'
        }
    });
    
    // Create the parties chart
    const partyTraces = partiesPerformance.map((party, index) => {
        const colors = ['#007bff', '#28a745', '#17a2b8', '#ffc107', '#6c757d']; // Colors for each party
        return {
            x: data.years,
            y: typeData.party_performance[party.party],
            type: 'scatter',
            mode: 'lines+markers',
            name: party.party,
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
    
    Plotly.newPlot('typePartiesChart', partyTraces, {
        title: `Top Parties in ${selectedType} Constituencies (1952-2024)`,
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
    
    // Create the turnout chart
    Plotly.newPlot('typeTurnoutChart', [{
        x: data.years,
        y: typeData.turnout_by_year,
        type: 'scatter',
        mode: 'lines+markers',
        line: {
            color: '#ffc107',
            width: 2
        },
        marker: {
            size: 8,
            color: '#ffc107'
        }
    }], {
        title: `Average Voter Turnout in ${selectedType} Constituencies (1952-2024)`,
        xaxis: {
            title: 'Election Year'
        },
        yaxis: {
            title: 'Turnout (%)'
        }
    });
}