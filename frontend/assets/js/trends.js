// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the trend data from sessionStorage
    const trendDataStr = sessionStorage.getItem('trendData');
    
    if (!trendDataStr) {
        alert('No trend data found. Redirecting to home page.');
        window.location.href = '/';
        return;
    }
    
    // Parse the JSON data
    const trendData = JSON.parse(trendDataStr);
    
    // Display the trend
    displayTrend(trendData);
});

// Display the party trend
function displayTrend(data) {
    // Set the title
    document.getElementById('trendTitle').textContent = `📊 Performance of ${data.party} Over Time`;
    
    // Display the graph
    const graphContainer = document.getElementById('graphContainer');
    graphContainer.innerHTML = data.graph_html;
}