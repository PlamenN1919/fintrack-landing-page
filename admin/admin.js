/**
 * FinTrack Analytics — Admin Dashboard JS
 * Streamlined: KPIs, Traffic, Sources, Top Buttons, Devices, Live Events
 */

// ══════════════════════════════════════
// SUPABASE SETUP
// ══════════════════════════════════════

const SUPABASE_URL  = 'https://mwqbnufrszmioqbfmdxe.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cWJudWZyc3ptaW9xYmZtZHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNDI3MDcsImV4cCI6MjA5MDgxODcwN30.jkvcGWlV499Bmxo7TgGqtRoiLcmNsIkYTWP3kR4vPNc';
const supabase      = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ══════════════════════════════════════
// LOCAL FETCH INTERCEPTOR
// Routes /api/* calls → Supabase queries
// ══════════════════════════════════════

const originalFetch = window.fetch;
window.fetch = async function (url, options) {
    if (typeof url !== 'string' || !url.includes('/api/')) {
        return originalFetch.apply(this, arguments);
    }

    // --- Auth ---
    if (url.includes('/auth/check')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return new Response(JSON.stringify({ authenticated: false }), { status: 401 });
        }
        return jsonResponse({ authenticated: true });
    }
    if (url.includes('/auth/logout')) {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
        return jsonResponse({ success: true });
    }

    try {
        const urlObj  = new URL(url);
        const path    = urlObj.pathname;
        const days    = parseInt(urlObj.searchParams.get('days') || '30');
        const fromIso = new Date(Date.now() - days * 86400000).toISOString();

        // --- Summary Stats ---
        if (path.includes('/stats/summary')) {
            const l24 = new Date(Date.now() - 86400000).toISOString();
            const l7  = new Date(Date.now() - 7 * 86400000).toISOString();

            const [v24, v7, c24, c7, act] = await Promise.all([
                supabase.from('page_visits').select('*', { count: 'exact', head: true }).gte('created_at', l24),
                supabase.from('page_visits').select('*', { count: 'exact', head: true }).gte('created_at', l7).lt('created_at', l24),
                supabase.from('click_events').select('*', { count: 'exact', head: true }).gte('created_at', l24),
                supabase.from('click_events').select('*', { count: 'exact', head: true }).gte('created_at', l7).lt('created_at', l24),
                supabase.from('active_sessions').select('*', { count: 'exact', head: true }).gte('last_seen', new Date(Date.now() - 300000).toISOString())
            ]);

            return jsonResponse({
                visits_24h:   v24.count || 0,
                visits_7d:    v7.count  || 0,
                clicks_24h:   c24.count || 0,
                clicks_7d:    c7.count  || 0,
                active_users: act.count || 0
            });
        }

        // --- Avg Time on Page ---
        if (path.includes('/stats/time-on-page')) {
            const result = await supabase.from('page_visits').select('time_on_page').gte('created_at', fromIso).not('time_on_page', 'is', null);
            const rows = result.data || [];
            const avg  = rows.length ? rows.reduce((s, r) => s + (r.time_on_page || 0), 0) / rows.length : 0;
            return jsonResponse({ average_seconds: avg });
        }

        // --- Chart Data (traffic + buttons + sources) ---
        if (path.includes('/stats/chart-data')) {
            const [visitsRes, clicksRes] = await Promise.all([
                supabase.from('page_visits').select('created_at, referrer').gte('created_at', fromIso),
                supabase.from('click_events').select('button_text, button_id').gte('created_at', fromIso)
            ]);

            const visitCounts  = {};
            const sourceCounts = {};
            (visitsRes.data || []).forEach(v => {
                const date = v.created_at.split('T')[0];
                visitCounts[date] = (visitCounts[date] || 0) + 1;
                const src = v.referrer || 'Direct';
                sourceCounts[src] = (sourceCounts[src] || 0) + 1;
            });

            const visits_by_day    = Object.entries(visitCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));
            const traffic_sources  = Object.entries(sourceCounts).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

            const btnCounts = {};
            (clicksRes.data || []).forEach(c => {
                const name = c.button_text || c.button_id || 'Unknown';
                btnCounts[name] = (btnCounts[name] || 0) + 1;
            });
            const top_buttons = Object.entries(btnCounts).map(([button_text, count]) => ({ button_text, count })).sort((a, b) => b.count - a.count);

            return jsonResponse({ visits_by_day, top_buttons, traffic_sources });
        }

        // --- Devices ---
        if (path.includes('/stats/devices')) {
            const { data } = await supabase.from('page_visits').select('device_type').gte('created_at', fromIso);
            const counts = {};
            (data || []).forEach(x => {
                const t = x.device_type || 'unknown';
                counts[t] = (counts[t] || 0) + 1;
            });
            return jsonResponse({
                devices: Object.entries(counts).map(([type, count]) => ({ type, count }))
            });
        }

        // --- Recent Events ---
        if (path.includes('/events/recent')) {
            const { data: v } = await supabase.from('page_visits').select('*').order('created_at', { ascending: false }).limit(20);
            const { data: c } = await supabase.from('click_events').select('*').order('created_at', { ascending: false }).limit(20);
            let combined = [
                ...(v || []).map(x => ({ ...x, type: 'page_visit' })),
                ...(c || []).map(x => ({ ...x, type: 'click' }))
            ];
            combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            return jsonResponse({ events: combined.slice(0, 25) });
        }

    } catch (e) {
        console.error('Fetch interceptor error:', e);
    }

    return jsonResponse({});
};

function jsonResponse(obj) {
    return new Response(JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// ══════════════════════════════════════
// SUPABASE REALTIME (pseudo-WebSocket)
// ══════════════════════════════════════

window.io = function () {
    return { on: (ev, cb) => { if (ev === 'connect') setTimeout(cb, 500); }, emit: () => {}, disconnect: () => {} };
};

setTimeout(() => {
    if (!supabase) return;
    supabase.channel('public:page_visits')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'page_visits' }, payload => {
            if (window.socket_callbacks?.page_visit) window.socket_callbacks.page_visit(payload.new);
        }).subscribe();

    supabase.channel('public:click_events')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'click_events' }, payload => {
            if (window.socket_callbacks?.button_click) window.socket_callbacks.button_click(payload.new);
        }).subscribe();
}, 2000);

// ══════════════════════════════════════
// CONFIG & STATE
// ══════════════════════════════════════

const API_URL = 'https://api.fintrackwallet.com/api';
const WS_URL  = 'wss://api.fintrackwallet.com';

let charts              = {};
let socket              = null;
let currentFilter       = 'all';
let statsRefreshInterval = null;
let globalDays          = 30;

// Chart.js global defaults for the dark-theme palette
Chart.defaults.color            = 'rgba(240,240,245,0.55)';
Chart.defaults.borderColor      = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family      = "'Inter', sans-serif";

// ══════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await initDashboard();

    updateClock();
    setInterval(updateClock, 1000);

    setupFilterButtons();
    connectWebSocket();

    statsRefreshInterval = setInterval(loadSummaryStats, 300000);

    initTheme();

    console.log('✅ Dashboard ready');
});

// ══════════════════════════════════════
// AUTH
// ══════════════════════════════════════

async function checkAuth() {
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        console.log('Local preview — auth bypassed');
        return;
    }
    try {
        const res = await fetch(`${API_URL}/auth/check`, { credentials: 'include' });
        if (res.ok) { const d = await res.json(); if (!d.authenticated) window.location.href = 'index.html'; }
        else window.location.href = 'index.html';
    } catch { window.location.href = 'index.html'; }
}

async function logout() {
    try { await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }); } catch {}
    window.location.href = 'index.html';
}

// ══════════════════════════════════════
// DASHBOARD INIT
// ══════════════════════════════════════

async function initDashboard() {
    await loadSummaryStats();
    await loadChartData();
    await loadRecentEvents();
}

// ══════════════════════════════════════
// KPI STATS
// ══════════════════════════════════════

async function loadSummaryStats() {
    try {
        const res   = await fetch(`${API_URL}/stats/summary`, { credentials: 'include' });
        if (!res.ok) throw new Error('stats fail');
        const stats = await res.json();

        setText('visits24h',      stats.visits_24h  || 0);
        setText('clicks24h',      stats.clicks_24h  || 0);
        setText('activeUsers',    stats.active_users || 0);
        setText('conversionRate', `${((stats.clicks_24h || 0) / Math.max(stats.visits_24h || 1, 1) * 100).toFixed(1)}%`);

        updateTrend('visitsTrend', stats.visits_24h, stats.visits_7d);
        updateTrend('clicksTrend', stats.clicks_24h, stats.clicks_7d);

        await loadAvgTime();
    } catch (e) {
        console.error('Stats error:', e);
    }
}

async function loadAvgTime() {
    try {
        const res  = await fetch(`${API_URL}/stats/time-on-page?days=${globalDays}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const mins = (data.average_seconds || 0) / 60;
        setText('avgTimeOnPage', `${mins.toFixed(1)} мин`);
    } catch {}
}

function updateTrend(id, current, previous) {
    const el = document.getElementById(id);
    if (!el) return;
    const avg    = (previous || 0) / 7;
    const change = avg ? ((current - avg) / avg * 100).toFixed(1) : 0;

    if (change > 0) {
        el.className = 'stat-trend up';
        el.innerHTML = `<i class="fas fa-arrow-up"></i> +${change}%`;
    } else if (change < 0) {
        el.className = 'stat-trend down';
        el.innerHTML = `<i class="fas fa-arrow-down"></i> ${change}%`;
    } else {
        el.className = 'stat-trend';
        el.innerHTML = `<i class="fas fa-minus"></i> 0%`;
    }
}

// ══════════════════════════════════════
// CHARTS
// ══════════════════════════════════════

const PALETTE = [
    '#6C5CE7', '#00cec9', '#00b894', '#fdcb6e',
    '#e17055', '#a29bfe', '#81ecec', '#fab1a0'
];

async function loadChartData() {
    try {
        const res  = await fetch(`${API_URL}/stats/chart-data?days=${globalDays}`, { credentials: 'include' });
        if (!res.ok) throw new Error('chart fail');
        const data = await res.json();

        createVisitsChart(data.visits_by_day  || []);
        createButtonsChart(data.top_buttons   || []);
        createSourcesChart(data.traffic_sources || []);

        await loadDevicesChart();
    } catch (e) {
        console.error('Charts error:', e);
    }
}

// ── Daily Traffic ──
function createVisitsChart(data) {
    const ctx = document.getElementById('visitsChart');
    if (!ctx) return;
    if (charts.visits) charts.visits.destroy();

    const labels = data.map(d => fmtDate(d.date));
    const values = data.map(d => d.count);

    charts.visits = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Посещения',
                data: values,
                borderColor: '#6C5CE7',
                backgroundColor: gradient(ctx, '#6C5CE7', 0.25, 0.0),
                borderWidth: 2.5,
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointBackgroundColor: '#6C5CE7',
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#6C5CE7',
                pointHoverBorderWidth: 2
            }]
        },
        options: chartOpts({ legend: false })
    });
}

// ── Top Buttons ──
function createButtonsChart(data) {
    const ctx = document.getElementById('buttonsChart');
    if (!ctx) return;
    if (charts.buttons) charts.buttons.destroy();

    const top = data.slice(0, 8);
    charts.buttons = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top.map(d => truncate(d.button_text || d.button_id, 18)),
            datasets: [{
                label: 'Кликвания',
                data: top.map(d => d.count),
                backgroundColor: top.map((_, i) => withAlpha(PALETTE[i % PALETTE.length], 0.75)),
                borderRadius: 6,
                borderSkipped: false,
                barPercentage: 0.65
            }]
        },
        options: chartOpts({ legend: false, xRotation: 35 })
    });
}

// ── Sources Doughnut ──
function createSourcesChart(data) {
    const ctx = document.getElementById('sourcesChart');
    if (!ctx) return;
    if (charts.sources) charts.sources.destroy();

    const top = data.slice(0, 6);
    charts.sources = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: top.map(d => d.source || 'Direct'),
            datasets: [{
                data: top.map(d => d.count),
                backgroundColor: top.map((_, i) => withAlpha(PALETTE[i % PALETTE.length], 0.8)),
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { padding: 14, font: { size: 12 }, usePointStyle: true, pointStyleWidth: 10 }
                }
            }
        }
    });
}

// ── Devices Doughnut ──
async function loadDevicesChart() {
    try {
        const res  = await fetch(`${API_URL}/stats/devices?days=${globalDays}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();

        const ctx = document.getElementById('devicesChart');
        if (!ctx) return;
        if (charts.devices) charts.devices.destroy();

        const items = (data.devices || []);
        const deviceColors = { desktop: '#6C5CE7', mobile: '#00b894', tablet: '#fdcb6e', unknown: '#636e72' };

        charts.devices = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: items.map(d => capitalize(d.type)),
                datasets: [{
                    data: items.map(d => d.count),
                    backgroundColor: items.map(d => deviceColors[d.type] || '#636e72'),
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '62%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { padding: 14, font: { size: 12 }, usePointStyle: true, pointStyleWidth: 10 }
                    }
                }
            }
        });
    } catch (e) {
        console.error('Devices chart error:', e);
    }
}

// ── Chart helpers ──
function chartOpts({ legend = true, xRotation = 0 } = {}) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: legend } },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' } },
            x: { grid: { display: false }, ticks: { maxRotation: xRotation, minRotation: xRotation } }
        }
    };
}

function gradient(ctx, hex, from, to) {
    const canvas = ctx instanceof HTMLCanvasElement ? ctx : ctx.canvas;
    const g = canvas.getContext('2d').createLinearGradient(0, 0, 0, canvas.height || 280);
    g.addColorStop(0, withAlpha(hex, from));
    g.addColorStop(1, withAlpha(hex, to));
    return g;
}

function withAlpha(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
}

// ══════════════════════════════════════
// EVENTS
// ══════════════════════════════════════

async function loadRecentEvents(filter = 'all') {
    const container = document.getElementById('eventsTableContainer');
    container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Зареждане…</p></div>`;

    try {
        const res    = await fetch(`${API_URL}/events/recent?limit=50&type=${filter}`, { credentials: 'include' });
        if (!res.ok) throw new Error();
        const result = await res.json();
        const events = result.events || result || [];

        if (!events.length) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>Няма събития</p></div>`;
            return;
        }

        container.innerHTML = `
            <table class="events-table">
                <thead><tr>
                    <th>Тип</th><th>Детайли</th><th>Устройство</th><th>URL</th><th>Време</th>
                </tr></thead>
                <tbody>${events.map(eventRow).join('')}</tbody>
            </table>`;
    } catch {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Грешка при зареждане</p></div>`;
    }
}

function eventRow(ev) {
    const isVisit  = ev.type === 'page_visit' || ev.type === 'visit';
    const label    = isVisit ? 'Посещение' : 'Кликване';
    const icon     = isVisit ? 'fa-eye' : 'fa-mouse-pointer';
    const badge    = isVisit ? 'visit' : 'click';
    const detail   = isVisit ? (ev.referrer || 'Direct') : (ev.button_text || ev.button_id || '—');

    let devIcon = 'fa-question';
    if (ev.device_type === 'mobile')  devIcon = 'fa-mobile-alt';
    if (ev.device_type === 'tablet')  devIcon = 'fa-tablet-alt';
    if (ev.device_type === 'desktop') devIcon = 'fa-desktop';
    const devInfo = ev.device_type ? `<i class="fas ${devIcon}"></i> ${ev.os_name || ''}` : '—';

    return `<tr>
        <td><span class="event-type-badge ${badge}"><i class="fas ${icon}"></i> ${label}</span></td>
        <td>${esc(detail)}</td>
        <td>${devInfo}</td>
        <td class="event-url">${esc(ev.page_url || '')}</td>
        <td class="event-time">${fmtTime(ev.created_at)}</td>
    </tr>`;
}

function refreshEvents() { loadRecentEvents(currentFilter); }

function setupFilterButtons() {
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadRecentEvents(currentFilter);
        });
    });
}

// ══════════════════════════════════════
// WEBSOCKET REAL-TIME
// ══════════════════════════════════════

function connectWebSocket() {
    try {
        socket = io(WS_URL.replace('ws://', 'http://').replace('wss://', 'https://'), { transports: ['websocket', 'polling'] });
        socket.on('connect',    () => console.log('✅ WS connected'));
        socket.on('disconnect', () => console.log('❌ WS disconnected'));

        socket.on('new_visit', d => handleNewEvent('visit', d));
        socket.on('new_click', d => handleNewEvent('click', d));
        socket.on('active_users_update', d => setText('activeUsers', d.count || 0));
    } catch {}
}

let debounce = null;
function handleNewEvent(type, data) {
    if (!debounce) debounce = setTimeout(() => { loadSummaryStats(); debounce = null; }, 5000);

    if (currentFilter === 'all' || currentFilter === `${type}s`) {
        const tbody = document.querySelector('.events-table tbody');
        if (!tbody) return;
        const tr = document.createElement('tr');
        tr.innerHTML = eventRow({ ...data, type });
        // eventRow returns <tr>…</tr>, extract inner
        const temp = document.createElement('table');
        temp.innerHTML = `<tbody>${eventRow({ ...data, type })}</tbody>`;
        const row = temp.querySelector('tr');
        tbody.insertBefore(row, tbody.firstChild);
        setTimeout(() => row.classList.add('new-event'), 50);
        if (tbody.children.length > 50) tbody.removeChild(tbody.lastChild);
    }
}

// ══════════════════════════════════════
// EXPORT
// ══════════════════════════════════════

function showExportModal()  { document.getElementById('exportModal').classList.add('active'); }
function closeExportModal() { document.getElementById('exportModal').classList.remove('active'); }

async function executeExport(event) {
    const type   = document.getElementById('exportType').value;
    const days   = document.getElementById('exportDays').value;
    const format = document.getElementById('exportFormat').value;
    const btn    = event?.currentTarget || document.getElementById('exportBtn');
    const orig   = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Експортиране…';
    btn.disabled = true;
    window.location.href = `${API_URL}/export/data?format=${format}&type=${type}&days=${days}`;
    setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; closeExportModal(); }, 2000);
}

window.addEventListener('click', e => { if (e.target === document.getElementById('exportModal')) closeExportModal(); });

// ══════════════════════════════════════
// THEME
// ══════════════════════════════════════

function initTheme() {
    const saved = localStorage.getItem('theme');
    const btn   = document.getElementById('themeToggleBtn');
    if (saved === 'light') {
        document.body.classList.add('light-theme');
        if (btn) btn.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    const btn     = document.getElementById('themeToggleBtn');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    if (btn) btn.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

// ══════════════════════════════════════
// DATE RANGE
// ══════════════════════════════════════

function updateGlobalDateRange() {
    globalDays = parseInt(document.getElementById('globalDateFilter')?.value || 30, 10);
    initDashboard();
}

// ══════════════════════════════════════
// UTILITY
// ══════════════════════════════════════

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function toggleSidebar() { document.getElementById('sidebar')?.classList.toggle('open'); }

function updateClock() {
    setText('currentTime', new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
}

function fmtDate(s) {
    return new Date(s).toLocaleDateString('bg-BG', { day: '2-digit', month: 'short' });
}

function fmtTime(s) {
    const diff = Date.now() - new Date(s).getTime();
    if (diff < 60000)   return 'Току-що';
    if (diff < 3600000) return `Преди ${Math.floor(diff / 60000)} мин`;
    if (diff < 86400000) return `Преди ${Math.floor(diff / 3600000)} ч`;
    return new Date(s).toLocaleDateString('bg-BG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function esc(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : (s || ''); }

// Cleanup
window.addEventListener('beforeunload', () => {
    if (socket) socket.disconnect();
    if (statsRefreshInterval) clearInterval(statsRefreshInterval);
});
