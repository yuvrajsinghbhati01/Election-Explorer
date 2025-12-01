/**
 * Chart utility functions for the Lok Sabha Elections Dashboard
 * Uses Chart.js for creating visualizations
 */

/**
 * Create a bar chart
 * @param {string} canvasId - Canvas element ID
 * @param {string[]} labels - Labels for X axis
 * @param {Object[]} datasets - Chart datasets
 * @param {Object} options - Additional chart options
 * @returns {Chart} - Chart instance
 */
function createBarChart(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) {
        console.error(`Canvas element with ID ${canvasId} not found`);
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            },
            tooltip: {
                intersect: false,
                mode: 'index'
            }
        },
        scales: {
            x: {
                ticks: {
                    autoSkip: true,
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        }
    };
    
    // Merge default options with provided options
    const chartOptions = { ...defaultOptions, ...options };
    
    // Create and return the chart
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: chartOptions
    });
}

/**
 * Create a line chart
 * @param {string} canvasId - Canvas element ID
 * @param {string[]} labels - Labels for X axis
 * @param {Object[]} datasets - Chart datasets
 * @param {Object} options - Additional chart options
 * @returns {Chart} - Chart instance
 */
function createLineChart(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) {
        console.error(`Canvas element with ID ${canvasId} not found`);
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            },
            tooltip: {
                intersect: false,
                mode: 'index'
            }
        },
        scales: {
            x: {
                ticks: {
                    autoSkip: true,
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        }
    };
    
    // Merge default options with provided options
    const chartOptions = { ...defaultOptions, ...options };
    
    // Create and return the chart
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: chartOptions
    });
}

/**
 * Create a pie chart
 * @param {string} canvasId - Canvas element ID
 * @param {string[]} labels - Labels for chart segments
 * @param {number[]} data - Data values
 * @param {string[]} backgroundColor - Background colors for segments
 * @param {Object} options - Additional chart options
 * @returns {Chart} - Chart instance
 */
function createPieChart(canvasId, labels, data, backgroundColor, options = {}) {
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) {
        console.error(`Canvas element with ID ${canvasId} not found`);
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.formattedValue;
                        const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((context.raw / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        }
    };
    
    // Merge default options with provided options
    const chartOptions = { ...defaultOptions, ...options };
    
    // Create and return the chart
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColor
            }]
        },
        options: chartOptions
    });
}

/**
 * Create a doughnut chart
 * @param {string} canvasId - Canvas element ID
 * @param {string[]} labels - Labels for chart segments
 * @param {number[]} data - Data values
 * @param {string[]} backgroundColor - Background colors for segments
 * @param {Object} options - Additional chart options
 * @returns {Chart} - Chart instance
 */
function createDoughnutChart(canvasId, labels, data, backgroundColor, options = {}) {
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) {
        console.error(`Canvas element with ID ${canvasId} not found`);
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.formattedValue;
                        const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((context.raw / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '50%'
    };
    
    // Merge default options with provided options
    const chartOptions = { ...defaultOptions, ...options };
    
    // Create and return the chart
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColor
            }]
        },
        options: chartOptions
    });
}

/**
 * Create a horizontal bar chart
 * @param {string} canvasId - Canvas element ID
 * @param {string[]} labels - Labels for Y axis
 * @param {Object[]} datasets - Chart datasets
 * @param {Object} options - Additional chart options
 * @returns {Chart} - Chart instance
 */
function createHorizontalBarChart(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) {
        console.error(`Canvas element with ID ${canvasId} not found`);
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default options
    const defaultOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            },
            tooltip: {
                intersect: false,
                mode: 'index'
            }
        }
    };
    
    // Merge default options with provided options
    const chartOptions = { ...defaultOptions, ...options };
    
    // Create and return the chart
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: chartOptions
    });
}

/**
 * Create a stacked bar chart
 * @param {string} canvasId - Canvas element ID
 * @param {string[]} labels - Labels for X axis
 * @param {Object[]} datasets - Chart datasets
 * @param {Object} options - Additional chart options
 * @returns {Chart} - Chart instance
 */
function createStackedBarChart(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) {
        console.error(`Canvas element with ID ${canvasId} not found`);
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default options with stacked scales
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            },
            tooltip: {
                intersect: false,
                mode: 'index'
            }
        },
        scales: {
            x: {
                stacked: true,
                ticks: {
                    autoSkip: true,
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                stacked: true
            }
        }
    };
    
    // Merge default options with provided options
    const chartOptions = { ...defaultOptions, ...options };
    
    // Create and return the chart
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: chartOptions
    });
}

/**
 * Create a radar chart
 * @param {string} canvasId - Canvas element ID
 * @param {string[]} labels - Labels for radar points
 * @param {Object[]} datasets - Chart datasets
 * @param {Object} options - Additional chart options
 * @returns {Chart} - Chart instance
 */
function createRadarChart(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) {
        console.error(`Canvas element with ID ${canvasId} not found`);
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            }
        },
        scales: {
            r: {
                angleLines: {
                    display: true
                },
                suggestedMin: 0
            }
        }
    };
    
    // Merge default options with provided options
    const chartOptions = { ...defaultOptions, ...options };
    
    // Create and return the chart
    return new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: chartOptions
    });
}

/**
 * Create a bubble chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object[]} datasets - Chart datasets
 * @param {Object} options - Additional chart options
 * @returns {Chart} - Chart instance
 */
function createBubbleChart(canvasId, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) {
        console.error(`Canvas element with ID ${canvasId} not found`);
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.dataset.label || '';
                        const x = context.parsed.x;
                        const y = context.parsed.y;
                        const r = context.parsed.r;
                        return `${label}: (${x}, ${y}, ${r})`;
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true
            },
            y: {
                beginAtZero: true
            }
        }
    };
    
    // Merge default options with provided options
    const chartOptions = { ...defaultOptions, ...options };
    
    // Create and return the chart
    return new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: datasets
        },
        options: chartOptions
    });
}

/**
 * Update chart data
 * @param {Chart} chart - Chart instance to update
 * @param {string[]} labels - New labels
 * @param {Object[]} datasets - New datasets
 */
function updateChart(chart, labels, datasets) {
    if (!chart) {
        console.error('Chart instance is null or undefined');
        return;
    }
    
    chart.data.labels = labels;
    chart.data.datasets = datasets;
    chart.update();
}

/**
 * Destroy chart to prevent memory leaks
 * @param {Chart} chart - Chart instance to destroy
 */
function destroyChart(chart) {
    if (chart) {
        chart.destroy();
    }
}

// Export chart functions
window.charts = {
    createBarChart,
    createLineChart,
    createPieChart,
    createDoughnutChart,
    createHorizontalBarChart,
    createStackedBarChart,
    createRadarChart,
    createBubbleChart,
    updateChart,
    destroyChart
};
