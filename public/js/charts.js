/**
 * CourierX - Admin Chart.js Integration with Theme Support
 */

let statusChartInstance = null;
let dailyChartInstance = null;
let agentChartInstance = null;

const getThemeColors = (theme) => {
    const isDark = theme === 'dark';
    return {
        textColor: isDark ? '#F8FAFC' : '#252525',
        mutedColor: isDark ? '#94A3B8' : '#78716C',
        gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        cardBg: isDark ? '#10243B' : '#FFFDF3',
        statusColors: [
            '#EAB308', // Booked
            '#0284C7', // Picked Up
            '#F97316', // In Transit
            '#8B5CF6', // Out for Delivery
            '#10B981', // Delivered
            '#EF4444'  // Failed
        ],
        primaryColor: isDark ? '#2563EB' : '#F4D35E',
        secondaryColor: isDark ? '#38BDF8' : '#D97706'
    };
};

const initAdminCharts = (data) => {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const colors = getThemeColors(theme);

    // 1. Parcel Status Distribution Chart (Doughnut)
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx && data.statusValues) {
        if (statusChartInstance) statusChartInstance.destroy();

        statusChartInstance = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: data.statusLabels,
                datasets: [{
                    data: data.statusValues,
                    backgroundColor: colors.statusColors,
                    borderWidth: 2,
                    borderColor: colors.cardBg
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: colors.textColor,
                            boxWidth: 12,
                            padding: 14,
                            font: { size: 11, weight: '600' }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }

    // 2. Daily Bookings Chart (Bar)
    const dailyCtx = document.getElementById('dailyChart');
    if (dailyCtx && data.dailyCounts) {
        if (dailyChartInstance) dailyChartInstance.destroy();

        dailyChartInstance = new Chart(dailyCtx, {
            type: 'bar',
            data: {
                labels: data.dailyLabels,
                datasets: [{
                    label: 'Bookings',
                    data: data.dailyCounts,
                    backgroundColor: colors.primaryColor,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.mutedColor, font: { size: 11 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: colors.gridColor },
                        ticks: {
                            precision: 0,
                            color: colors.mutedColor,
                            font: { size: 11 }
                        }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 3. Agent Load Chart (Horizontal Bar)
    const agentCtx = document.getElementById('agentChart');
    if (agentCtx && data.agentCounts) {
        if (agentChartInstance) agentChartInstance.destroy();

        agentChartInstance = new Chart(agentCtx, {
            type: 'bar',
            data: {
                labels: data.agentLabels,
                datasets: [{
                    label: 'Assigned Parcels',
                    data: data.agentCounts,
                    backgroundColor: colors.secondaryColor,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: colors.gridColor },
                        ticks: { precision: 0, color: colors.mutedColor }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: colors.textColor, font: { weight: '600' } }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
};

/**
 * Dynamically reapply colors when user switches between Light & Dark themes
 */
window.updateChartsTheme = (newTheme) => {
    if (window.adminChartPayload) {
        initAdminCharts(window.adminChartPayload);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (window.adminChartPayload) {
        initAdminCharts(window.adminChartPayload);
    }
});
