/**
 * Utility functions for the Lok Sabha Elections Dashboard
 */

// API base URL - Change if deploying to a different server
const API_BASE_URL = '/api';

/**
 * Fetch data from the API
 * @param {string} endpoint - API endpoint to fetch data from
 * @param {Object} params - Query parameters for the request
 * @returns {Promise<Object>} - API response data
 */
async function fetchData(endpoint, params = {}) {
    try {
        // Build URL with query parameters if provided
        let url = `${API_BASE_URL}/${endpoint}`;
        
        if (Object.keys(params).length > 0) {
            const queryParams = new URLSearchParams();
            
            for (const [key, value] of Object.entries(params)) {
                if (Array.isArray(value)) {
                    // Handle array parameters (e.g., years=2019&years=2014)
                    value.forEach(item => queryParams.append(key, item));
                } else {
                    queryParams.append(key, value);
                }
            }
            
            url += `?${queryParams.toString()}`;
        }
        
        // Make the request
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Initialize the theme based on user preference
 */
function initTheme() {
    const themeSwitch = document.getElementById('themeSwitch');
    
    // Check for saved theme preference or use device preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
        document.body.setAttribute('data-bs-theme', 'dark');
        themeSwitch.checked = true;
    } else {
        document.body.setAttribute('data-bs-theme', 'light');
        themeSwitch.checked = false;
    }
    
    // Handle theme switch
    themeSwitch.addEventListener('change', function() {
        if (this.checked) {
            document.body.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.setAttribute('data-bs-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });
}

/**
 * Initialize search functionality
 */
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResultsModal = new bootstrap.Modal(document.getElementById('searchResultsModal'));
    const searchResults = document.getElementById('searchResults');
    
    // Function to perform the search
    async function performSearch() {
        const query = searchInput.value.trim();
        
        if (query.length < 2) {
            return; // Don't search for very short queries
        }
        
        try {
            searchResults.innerHTML = '<div class="d-flex justify-content-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
            
            const data = await fetchData('search', { q: query });
            
            let resultsHtml = '';
            
            // Display constituency results
            if (data.constituencies && data.constituencies.length > 0) {
                resultsHtml += `
                    <div class="search-section">
                        <h5>Constituencies</h5>
                        <div class="list-group">
                `;
                
                data.constituencies.forEach(item => {
                    resultsHtml += `
                        <a href="constituency.html?name=${encodeURIComponent(item)}" class="list-group-item list-group-item-action">${item}</a>
                    `;
                });
                
                resultsHtml += `</div></div>`;
            }
            
            // Display candidate results
            if (data.candidates && data.candidates.length > 0) {
                resultsHtml += `
                    <div class="search-section">
                        <h5>Candidates</h5>
                        <div class="list-group">
                `;
                
                data.candidates.forEach(item => {
                    resultsHtml += `
                        <div class="list-group-item">${item}</div>
                    `;
                });
                
                resultsHtml += `</div></div>`;
            }
            
            // Display party results
            if (data.parties && data.parties.length > 0) {
                resultsHtml += `
                    <div class="search-section">
                        <h5>Parties</h5>
                        <div class="list-group">
                `;
                
                data.parties.forEach(item => {
                    resultsHtml += `
                        <a href="parties.html?name=${encodeURIComponent(item)}" class="list-group-item list-group-item-action">${item}</a>
                    `;
                });
                
                resultsHtml += `</div></div>`;
            }
            
            // If no results were found
            if (resultsHtml === '') {
                resultsHtml = `<p class="text-center">No results found for "${query}"</p>`;
            }
            
            searchResults.innerHTML = resultsHtml;
            searchResultsModal.show();
            
        } catch (error) {
            searchResults.innerHTML = `<div class="alert alert-danger">Error searching: ${error.message}</div>`;
            searchResultsModal.show();
        }
    }
    
    // Search on button click
    searchButton.addEventListener('click', performSearch);
    
    // Search on Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

/**
 * Get color for a party
 * @param {string} party - Party name
 * @param {number} index - Index for fallback color
 * @returns {string} - CSS color value
 */
function getPartyColor(party, index = 0) {
    // Common party colors
    const partyColors = {
        'Bharatiya Janta Party': '#ff9933', // BJP - Saffron
        'Indian National Congress': '#00bfff', // Congress - Light Blue
        'Communist Party Of India (MARXIST)': '#ff0000', // CPI(M) - Red
        'Communist Party Of India': '#ff0000', // CPI - Red
        'Aam Aadmi Party': '#2ecc71', // AAP - Green
        'All India Trinamool Congress': '#66bb6a', // TMC - Green shade
        'Nationalist Congress Party': '#4d1a7f', // NCP - Purple
        'Dravida Munetra Kazhagam': '#d50000', // DMK - Red shade
        'Samajwadi Party': '#ec407a', // SP - Pink-Red
        'Rashtriya Janata Dal': '#009688', // RJD - Teal
        'Bahujan Samaj Party': '#0d47a1', // BSP - Blue
        'Telugu Desam': '#ffeb3b', // TDP - Yellow
        'Yuvajana Sramika Rythu Congress Party': '#7b1fa2', // YSRCP - Purple
        'Shiv Sena': '#ff5722', // SS - Orange
        'Janata Dal (United)': '#43a047', // JD(U) - Green
        'Shiromani Akali Dal': '#00695c', // SAD - Dark Teal
        'Biju Janata Dal': '#795548', // BJD - Brown
        'Telangana Rashtra Samithi': '#e91e63' // TRS - Pink
    };
    
    // Fallback color palette for other parties
    const colorPalette = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', 
        '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b',
        '#27ae60', '#8e44ad', '#2980b9', '#f1c40f', '#e67e22'
    ];
    
    // Return the party's color if defined, otherwise use a color from the palette
    return partyColors[party] || colorPalette[index % colorPalette.length];
}

/**
 * Format number with commas for thousands
 * @param {number} num - Number to format
 * @returns {string} - Formatted number string
 */
function formatNumber(num) {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
}

/**
 * Truncate long text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length before truncation
 * @returns {string} - Truncated text
 */
function truncateText(text, length = 30) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

/**
 * Get URL parameters as an object
 * @returns {Object} - URL parameters
 */
function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }
    
    return params;
}

/**
 * Create a badge element for a party
 * @param {string} party - Party name
 * @param {number} colorIndex - Index for color selection
 * @returns {string} - HTML for party badge
 */
function createPartyBadge(party, colorIndex = 0) {
    const color = getPartyColor(party, colorIndex);
    return `<span class="party-badge" style="background-color: ${color}">${truncateText(party, 15)}</span>`;
}

/**
 * Sort object by values
 * @param {Object} obj - Object to sort
 * @param {boolean} ascending - Sort in ascending order
 * @returns {Object} - Sorted object
 */
function sortObjectByValues(obj, ascending = false) {
    return Object.fromEntries(
        Object.entries(obj)
            .sort(([, a], [, b]) => ascending ? a - b : b - a)
    );
}

/**
 * Remove spinner from element and show content
 * @param {HTMLElement} element - Element containing spinner
 * @param {string} content - Content to show
 */
function removeSpinner(element, content) {
    element.innerHTML = content;
}

// Export utility functions
window.utils = {
    fetchData,
    initTheme,
    initSearch,
    getPartyColor,
    formatNumber,
    truncateText,
    getUrlParams,
    createPartyBadge,
    sortObjectByValues,
    removeSpinner
};

// Initialize theme and search on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initSearch();
});
