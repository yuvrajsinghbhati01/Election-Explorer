// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the result data from sessionStorage
    const resultDataStr = sessionStorage.getItem('resultData');
    
    if (!resultDataStr) {
        alert('No result data found. Redirecting to home page.');
        window.location.href = '/';
        return;
    }
    
    // Parse the JSON data
    const resultData = JSON.parse(resultDataStr);
    
    // Display the results
    displayResults(resultData);
});

// Display the election results
function displayResults(data) {
    // Set the title
    document.getElementById('resultTitle').textContent = `Results for ${data.constituency} in ${data.year}`;
    
    // Winner section
    if (data.winner) {
        const winner = data.winner;
        document.getElementById('winnerDetails').innerHTML = `
            ${winner.candidate || 'Unknown'} (${winner.party || 'Unknown'}) - 
            ${formatNumber(winner.votes) || 0} votes
        `;
    } else {
        document.getElementById('winnerSection').innerHTML = '<p>No winner data found.</p>';
    }
    
    // Runner-up section
    if (data.runner_up) {
        const runnerUp = data.runner_up;
        document.getElementById('runnerUpDetails').innerHTML = `
            ${runnerUp.candidate || 'Unknown'} (${runnerUp.party || 'Unknown'}) - 
            ${formatNumber(runnerUp.votes) || 0} votes
        `;
    } else {
        document.getElementById('runnerUpSection').style.display = 'none';
    }
    
    // Results table
    const tableBody = document.getElementById('resultTableBody');
    tableBody.innerHTML = '';
    
    if (data.results && data.results.length > 0) {
        data.results.forEach((row, index) => {
            const isWinner = (data.winner && row.candidate === data.winner.candidate);
            const tr = document.createElement('tr');
            if (isWinner) {
                tr.classList.add('winner');
            }
            
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${row.constituency || '-'}</td>
                <td>${row.state || '-'}</td>
                <td>${row.candidate || '-'}</td>
                <td>${row.party || '-'}</td>
                <td>${formatNumber(row.electors) || '-'}</td>
                <td>${formatNumber(row.votes) || '-'}</td>
                <td>${row.turnout || '-'}</td>
            `;
            
            tableBody.appendChild(tr);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No data available</td></tr>';
    }
}

// Format number with commas
function formatNumber(num) {
    if (num === null || num === undefined) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}