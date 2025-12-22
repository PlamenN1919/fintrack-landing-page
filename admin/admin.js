/**
 * FinTrack Analytics Admin Dashboard
 * Real-time analytics dashboard with WebSocket support
 */

// Configuration
const API_URL = window.ANALYTICS_API_URL || 'http://localhost:5001/api';
const WS_URL = window.ANALYTICS_WS_URL || 'ws://localhost:5001';

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
        
    } catch (error) {
        console.error('Error loading stats:', error);
        showError('Грешка при зареждане на статистики');
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
        
    } catch (error) {
        console.error('Error loading chart data:', error);
        showError('Грешка при зареждане на графики');
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
            
            tableHTML += `
                <tr>
                    <td>
                        <span class="event-type-badge ${event.type}">
                            <i class="fas ${eventIcon}"></i> ${eventType}
                        </span>
                    </td>
                    <td>${escapeHtml(eventDetails)}</td>
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

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (socket) socket.disconnect();
    if (statsRefreshInterval) clearInterval(statsRefreshInterval);
});

