/**
 * FinTrack Analytics Admin Dashboard
 * Real-time analytics dashboard with WebSocket support
 */

// Configuration
const API_URL = window.ANALYTICS_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5001/api' : 'https://fintrack-landing-page-production-f3af.up.railway.app/api');
const WS_URL = window.ANALYTICS_WS_URL || (window.location.hostname === 'localhost' ? 'ws://localhost:5001' : 'wss://fintrack-landing-page-production-f3af.up.railway.app');

// State
let charts = {};
let socket = null;
let currentFilter = 'all';
let statsRefreshInterval = null;

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    await checkAuth();
    
    // Initialize dashboard
    await initDashboard();
    
    // Start real-time clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Setup filter buttons
    setupFilterButtons();
    
    // Connect WebSocket for real-time updates
    connectWebSocket();
    
    // Refresh stats every 30 seconds
    statsRefreshInterval = setInterval(loadSummaryStats, 30000);
    
    console.log('✅ Dashboard initialized');
});

// ===================================
// AUTHENTICATION
// ===================================

async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/check`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (!data.authenticated) {
                window.location.href = 'index.html';
            }
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'index.html';
    }
}

async function logout() {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    window.location.href = 'index.html';
}

// ===================================
// DASHBOARD INITIALIZATION
// ===================================

async function initDashboard() {
    // Load summary stats
    await loadSummaryStats();
    
    // Load chart data
    await loadChartData();
    
    // Load recent events
    await loadRecentEvents();
}

// ===================================
// SUMMARY STATS
// ===================================

async function loadSummaryStats() {
    try {
        const response = await fetch(`${API_URL}/stats/summary`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load stats');
        
        const stats = await response.json();
        
        // Update DOM
        document.getElementById('visits24h').textContent = stats.visits_24h || 0;
        document.getElementById('clicks24h').textContent = stats.clicks_24h || 0;
        document.getElementById('activeUsers').textContent = stats.active_users || 0;
        document.getElementById('conversionRate').textContent = `${stats.conversion_rate || 0}%`;
        
        // Calculate trends (placeholder - would need historical data)
        updateTrend('visitsTrend', stats.visits_24h, stats.visits_7d);
        updateTrend('clicksTrend', stats.clicks_24h, stats.clicks_7d);
        
        // Load average time on page
        await loadAvgTimeOnPage();
        
    } catch (error) {
        console.error('Error loading stats:', error);
        showError('Грешка при зареждане на статистики');
    }
}

async function loadAvgTimeOnPage() {
    try {
        const response = await fetch(`${API_URL}/stats/time-on-page?days=30`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load time stats');
        
        const data = await response.json();
        const avgMinutes = data.average_time_minutes || 0;
        
        document.getElementById('avgTimeOnPage').textContent = `${avgMinutes} мин`;
        
    } catch (error) {
        console.error('Error loading time on page:', error);
    }
}

function updateTrend(elementId, current, previous) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const weekAvg = previous / 7;
    const change = ((current - weekAvg) / weekAvg * 100).toFixed(1);
    
    if (change > 0) {
        element.className = 'stat-trend up';
        element.innerHTML = `<i class="fas fa-arrow-up"></i> +${change}%`;
    } else if (change < 0) {
        element.className = 'stat-trend down';
        element.innerHTML = `<i class="fas fa-arrow-down"></i> ${change}%`;
    } else {
        element.className = 'stat-trend';
        element.innerHTML = `<i class="fas fa-minus"></i> ${change}%`;
    }
}

// ===================================
// CHARTS
// ===================================

async function loadChartData() {
    try {
        const response = await fetch(`${API_URL}/stats/chart-data`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load chart data');
        
        const data = await response.json();
        
        // Create charts
        createVisitsChart(data.visits_by_day);
        createButtonsChart(data.top_buttons);
        createSourcesChart(data.traffic_sources);
        
        // Load device statistics
        await loadDeviceCharts();
        
        // Load geographic data
        await loadGeographicChart();
        
        // Load conversion funnel
        await loadConversionFunnel();
        
        // Load heatmap
        await loadHeatmap();
        
    } catch (error) {
        console.error('Error loading chart data:', error);
        showError('Грешка при зареждане на графики');
    }
}

async function loadDeviceCharts() {
    try {
        const response = await fetch(`${API_URL}/stats/devices?days=30`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load device data');
        
        const data = await response.json();
        
        // Create device charts
        createDevicesChart(data.devices);
        createOSChart(data.operating_systems);
        createBrowsersChart(data.browsers);
        
    } catch (error) {
        console.error('Error loading device charts:', error);
        showError('Грешка при зареждане на device статистики');
    }
}

function createVisitsChart(data) {
    const ctx = document.getElementById('visitsChart');
    if (!ctx) return;
    
    // Prepare data
    const labels = data.map(d => formatDate(d.date)).reverse();
    const values = data.map(d => d.count).reverse();
    
    // Destroy existing chart
    if (charts.visits) charts.visits.destroy();
    
    // Create new chart
    charts.visits = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Посещения',
                data: values,
                borderColor: 'rgb(102, 126, 234)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function createButtonsChart(data) {
    const ctx = document.getElementById('buttonsChart');
    if (!ctx) return;
    
    // Prepare data
    const labels = data.map(d => d.button_text || d.button_id).slice(0, 10);
    const values = data.map(d => d.click_count).slice(0, 10);
    
    // Destroy existing chart
    if (charts.buttons) charts.buttons.destroy();
    
    // Create new chart
    charts.buttons = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Кликвания',
                data: values,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(0, 242, 254, 0.8)',
                    'rgba(255, 107, 107, 0.8)',
                    'rgba(102, 126, 234, 0.6)',
                    'rgba(118, 75, 162, 0.6)',
                    'rgba(76, 175, 80, 0.6)',
                    'rgba(255, 193, 7, 0.6)'
                ],
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function createSourcesChart(data) {
    const ctx = document.getElementById('sourcesChart');
    if (!ctx) return;
    
    // Prepare data
    const labels = data.map(d => d.source || 'Unknown').slice(0, 6);
    const values = data.map(d => d.count).slice(0, 6);
    
    // Destroy existing chart
    if (charts.sources) charts.sources.destroy();
    
    // Create new chart
    charts.sources = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(0, 242, 254, 0.8)',
                    'rgba(255, 107, 107, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

function createDevicesChart(data) {
    const ctx = document.getElementById('devicesChart');
    if (!ctx) return;
    
    // Prepare data
    const labels = data.map(d => {
        const type = d.type || 'unknown';
        return type.charAt(0).toUpperCase() + type.slice(1);
    });
    const values = data.map(d => d.count);
    
    // Destroy existing chart
    if (charts.devices) charts.devices.destroy();
    
    // Create new chart
    charts.devices = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',  // Desktop
                    'rgba(76, 175, 80, 0.8)',    // Mobile
                    'rgba(255, 193, 7, 0.8)',    // Tablet
                    'rgba(255, 107, 107, 0.8)'   // Unknown
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

function createOSChart(data) {
    const ctx = document.getElementById('osChart');
    if (!ctx) return;
    
    // Prepare data
    const labels = data.map(d => d.name || 'Unknown').slice(0, 8);
    const values = data.map(d => d.count).slice(0, 8);
    
    // Destroy existing chart
    if (charts.os) charts.os.destroy();
    
    // Create new chart
    charts.os = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Посещения',
                data: values,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(0, 242, 254, 0.8)',
                    'rgba(255, 107, 107, 0.8)',
                    'rgba(102, 126, 234, 0.6)',
                    'rgba(118, 75, 162, 0.6)'
                ],
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function createBrowsersChart(data) {
    const ctx = document.getElementById('browsersChart');
    if (!ctx) return;
    
    // Prepare data
    const labels = data.map(d => d.name || 'Unknown').slice(0, 8);
    const values = data.map(d => d.count).slice(0, 8);
    
    // Destroy existing chart
    if (charts.browsers) charts.browsers.destroy();
    
    // Create new chart
    charts.browsers = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Посещения',
                data: values,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(0, 242, 254, 0.8)',
                    'rgba(255, 107, 107, 0.8)',
                    'rgba(102, 126, 234, 0.6)',
                    'rgba(118, 75, 162, 0.6)'
                ],
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

async function loadGeographicChart() {
    try {
        const response = await fetch(`${API_URL}/stats/geographic?days=30&limit=15`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load geographic data');
        
        const data = await response.json();
        
        createGeoChart(data.countries);
        
    } catch (error) {
        console.error('Error loading geographic chart:', error);
        showError('Грешка при зареждане на географски данни');
    }
}

function createGeoChart(data) {
    const ctx = document.getElementById('geoChart');
    if (!ctx) return;
    
    // Country code to name mapping (top countries)
    const countryNames = {
        'BG': 'България',
        'US': 'САЩ',
        'GB': 'Великобритания',
        'DE': 'Германия',
        'FR': 'Франция',
        'IT': 'Италия',
        'ES': 'Испания',
        'RU': 'Русия',
        'CN': 'Китай',
        'JP': 'Япония',
        'CA': 'Канада',
        'AU': 'Австралия',
        'BR': 'Бразилия',
        'IN': 'Индия',
        'MX': 'Мексико'
    };
    
    // Prepare data
    const labels = data.map(d => countryNames[d.country_code] || d.country_code || 'Unknown');
    const values = data.map(d => d.count);
    
    // Destroy existing chart
    if (charts.geo) charts.geo.destroy();
    
    // Create new chart
    charts.geo = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Посещения',
                data: values,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        display: false
                    }
                },
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

async function loadConversionFunnel() {
    try {
        const response = await fetch(`${API_URL}/stats/funnel?days=30`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load funnel data');
        
        const data = await response.json();
        
        createFunnelChart(data.funnel);
        
    } catch (error) {
        console.error('Error loading funnel:', error);
        showError('Грешка при зареждане на conversion funnel');
    }
}

function createFunnelChart(data) {
    const ctx = document.getElementById('funnelChart');
    if (!ctx) return;
    
    // Event name mapping
    const eventNames = {
        'page_land': 'Посещение на страница',
        'scroll_50': 'Скрол 50%',
        'cta_click': 'Клик на CTA',
        'form_submit': 'Изпращане на форма',
        'download': 'Изтегляне'
    };
    
    // Prepare data
    const labels = data.map(d => eventNames[d.event_name] || d.event_name);
    const values = data.map(d => d.unique_sessions);
    
    // Calculate conversion rates
    const conversionRates = values.map((val, idx) => {
        if (idx === 0) return 100;
        return ((val / values[0]) * 100).toFixed(1);
    });
    
    // Destroy existing chart
    if (charts.funnel) charts.funnel.destroy();
    
    // Create new chart
    charts.funnel = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Потребители',
                data: values,
                backgroundColor: values.map((_, idx) => {
                    const opacity = 1 - (idx * 0.15);
                    return `rgba(102, 126, 234, ${opacity})`;
                }),
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            return `Conversion: ${conversionRates[context.dataIndex]}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        display: false
                    }
                },
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

async function loadHeatmap(pageUrl = null) {
    const container = document.getElementById('heatmapContainer');
    
    try {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Зареждане на heatmap данни...</p>
            </div>
        `;
        
        const url = pageUrl 
            ? `${API_URL}/stats/heatmap?page_url=${encodeURIComponent(pageUrl)}&days=7`
            : `${API_URL}/stats/heatmap?days=7`;
        
        const response = await fetch(url, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load heatmap data');
        
        const data = await response.json();
        
        if (data.clicks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-mouse-pointer"></i>
                    <p>Няма данни за heatmap</p>
                </div>
            `;
            return;
        }
        
        // Create heatmap visualization
        renderHeatmap(data.clicks, container);
        
    } catch (error) {
        console.error('Error loading heatmap:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Грешка при зареждане на heatmap</p>
            </div>
        `;
    }
}

function renderHeatmap(clicks, container) {
    // Group clicks by coordinates
    const clickMap = {};
    
    clicks.forEach(click => {
        const key = `${click.x_position},${click.y_position}`;
        if (!clickMap[key]) {
            clickMap[key] = {
                x: click.x_position,
                y: click.y_position,
                count: 0
            };
        }
        clickMap[key].count++;
    });
    
    // Find max count for normalization
    const maxCount = Math.max(...Object.values(clickMap).map(c => c.count));
    
    // Create canvas for heatmap
    container.innerHTML = `
        <div style="position: relative; width: 100%; height: 600px; background: #f5f5f5;">
            <p style="color: #333; padding: 20px; text-align: center;">
                Heatmap визуализация<br>
                <small>Показани са ${clicks.length} кликвания</small>
            </p>
            <div id="heatmapPoints"></div>
        </div>
    `;
    
    const pointsContainer = document.getElementById('heatmapPoints');
    
    // Add points
    Object.values(clickMap).forEach(point => {
        const intensity = point.count / maxCount;
        const size = 20 + (intensity * 30);
        const opacity = 0.3 + (intensity * 0.5);
        
        const pointEl = document.createElement('div');
        pointEl.className = 'heatmap-point';
        pointEl.style.left = `${(point.x / 1920) * 100}%`;
        pointEl.style.top = `${(point.y / 1080) * 100}%`;
        pointEl.style.width = `${size}px`;
        pointEl.style.height = `${size}px`;
        pointEl.style.background = `rgba(255, 107, 107, ${opacity})`;
        pointEl.title = `${point.count} кликвания`;
        
        pointsContainer.appendChild(pointEl);
    });
}

function refreshHeatmap() {
    const select = document.getElementById('heatmapPageSelect');
    const pageUrl = select.value;
    loadHeatmap(pageUrl || null);
}

// ===================================
// EVENTS TABLE
// ===================================

async function loadRecentEvents(filter = 'all') {
    const container = document.getElementById('eventsTableContainer');
    
    try {
        // Show loading
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Зареждане на събития...</p>
            </div>
        `;
        
        const response = await fetch(`${API_URL}/events/recent?limit=50&type=${filter}`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load events');
        
        const events = await response.json();
        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Няма събития</p>
                </div>
            `;
            return;
        }
        
        // Create table
        let tableHTML = `
            <table class="events-table">
                <thead>
                    <tr>
                        <th>Тип</th>
                        <th>Детайли</th>
                        <th>Устройство</th>
                        <th>URL</th>
                        <th>Време</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        events.forEach(event => {
            const eventType = event.type === 'visit' ? 'Посещение' : 'Кликване';
            const eventIcon = event.type === 'visit' ? 'fa-eye' : 'fa-mouse-pointer';
            const eventDetails = event.type === 'visit' 
                ? (event.referrer || 'Direct')
                : `${event.button_text || event.button_id}`;
            
            // Device icon
            let deviceIcon = 'fa-question';
            if (event.device_type === 'mobile') deviceIcon = 'fa-mobile-alt';
            else if (event.device_type === 'tablet') deviceIcon = 'fa-tablet-alt';
            else if (event.device_type === 'desktop') deviceIcon = 'fa-desktop';
            
            const deviceInfo = event.device_type 
                ? `<i class="fas ${deviceIcon}"></i> ${event.os_name || ''}`
                : '-';
            
            tableHTML += `
                <tr>
                    <td>
                        <span class="event-type-badge ${event.type}">
                            <i class="fas ${eventIcon}"></i> ${eventType}
                        </span>
                    </td>
                    <td>${escapeHtml(eventDetails)}</td>
                    <td>${deviceInfo}</td>
                    <td class="event-url">${escapeHtml(event.page_url)}</td>
                    <td class="event-time">${formatTime(event.created_at)}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        
    } catch (error) {
        console.error('Error loading events:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Грешка при зареждане на събития</p>
            </div>
        `;
    }
}

function refreshEvents() {
    loadRecentEvents(currentFilter);
}

function setupFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Load filtered events
            currentFilter = filter;
            loadRecentEvents(filter);
        });
    });
}

// ===================================
// WEBSOCKET (REAL-TIME UPDATES)
// ===================================

function connectWebSocket() {
    try {
        socket = io(WS_URL.replace('ws://', 'http://').replace('wss://', 'https://'), {
            transports: ['websocket', 'polling']
        });
        
        socket.on('connect', () => {
            console.log('✅ WebSocket connected');
        });
        
        socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
        });
        
        socket.on('new_visit', (data) => {
            console.log('New visit:', data);
            handleNewEvent('visit', data);
        });
        
        socket.on('new_click', (data) => {
            console.log('New click:', data);
            handleNewEvent('click', data);
        });
        
        socket.on('active_users_update', (data) => {
            document.getElementById('activeUsers').textContent = data.count || 0;
        });
        
        // Listen for device stats updates
        socket.on('device_stats_update', (data) => {
            console.log('Device stats update:', data);
            // Reload device charts
            loadDeviceCharts();
        });
        
        // Listen for heatmap updates
        socket.on('heatmap_update', (data) => {
            console.log('Heatmap update:', data);
            // Could update heatmap in real-time if visible
        });
        
        // Listen for conversion updates
        socket.on('conversion_update', (data) => {
            console.log('Conversion update:', data);
            // Reload funnel chart
            loadConversionFunnel();
        });
        
        // Listen for geographic updates
        socket.on('geographic_update', (data) => {
            console.log('Geographic update:', data);
            // Reload geographic chart
            loadGeographicChart();
        });
        
        // Setup ping/pong for keep-alive
        setInterval(() => {
            if (socket && socket.connected) {
                socket.emit('ping');
            }
        }, 30000);
        
    } catch (error) {
        console.error('WebSocket error:', error);
        console.log('Running without real-time updates');
    }
}

function handleNewEvent(type, data) {
    // Refresh stats
    loadSummaryStats();
    
    // Add event to table if visible
    if (currentFilter === 'all' || currentFilter === `${type}s`) {
        const tbody = document.querySelector('.events-table tbody');
        if (tbody) {
            const row = createEventRow(type, data);
            tbody.insertBefore(row, tbody.firstChild);
            
            // Highlight new row
            setTimeout(() => row.classList.add('new-event'), 100);
            
            // Remove oldest row if table too long
            if (tbody.children.length > 50) {
                tbody.removeChild(tbody.lastChild);
            }
        }
    }
}

function createEventRow(type, data) {
    const row = document.createElement('tr');
    
    const eventType = type === 'visit' ? 'Посещение' : 'Кликване';
    const eventIcon = type === 'visit' ? 'fa-eye' : 'fa-mouse-pointer';
    const eventDetails = type === 'visit' 
        ? (data.referrer || 'Direct')
        : (data.button_text || data.button_id);
    
    row.innerHTML = `
        <td>
            <span class="event-type-badge ${type}">
                <i class="fas ${eventIcon}"></i> ${eventType}
            </span>
        </td>
        <td>${escapeHtml(eventDetails)}</td>
        <td class="event-url">${escapeHtml(data.page_url || '')}</td>
        <td class="event-time">${formatTime(data.timestamp)}</td>
    `;
    
    return row;
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('bg-BG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
        day: '2-digit',
        month: 'short'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) {
        return 'Току-що';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `Преди ${minutes} мин`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `Преди ${hours} ч`;
    }
    
    // More than 24 hours
    return date.toLocaleDateString('bg-BG', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function showError(message) {
    console.error(message);
    // Could add toast notification here
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

// ===================================
// EXPORT FUNCTIONALITY
// ===================================

function showExportModal() {
    const modal = document.getElementById('exportModal');
    modal.classList.add('active');
}

function closeExportModal() {
    const modal = document.getElementById('exportModal');
    modal.classList.remove('active');
}

async function executeExport() {
    const type = document.getElementById('exportType').value;
    const days = document.getElementById('exportDays').value;
    const format = document.getElementById('exportFormat').value;
    
    try {
        // Show loading
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Експортиране...';
        btn.disabled = true;
        
        // Download file
        const url = `${API_URL}/export/data?format=${format}&type=${type}&days=${days}`;
        window.location.href = url;
        
        // Reset button after delay
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            closeExportModal();
        }, 2000);
        
    } catch (error) {
        console.error('Export error:', error);
        showError('Грешка при експортиране на данни');
    }
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    const modal = document.getElementById('exportModal');
    if (e.target === modal) {
        closeExportModal();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (socket) socket.disconnect();
    if (statsRefreshInterval) clearInterval(statsRefreshInterval);
});

