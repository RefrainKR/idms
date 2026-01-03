export function renderChart(canvasId, labels, data, colors, tooltipValues, chartInstanceRef) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // [수정] 애니메이션 비활성화
            layout: { padding: 10 },
            plugins: {
                title: { display: false },
                legend: { display: false },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 14 },
                    formatter: (value, context) => {
                        if (value < 3) return null;
                        return `${context.chart.data.labels[context.dataIndex]}\n${value}%`;
                    },
                    textAlign: 'center',
                    textShadowBlur: 4,
                    textShadowColor: 'rgba(0,0,0,0.5)'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const label = context.label;
                            const formattedVal = tooltipValues[index];
                            return ` ${label}: ${formattedVal}`;
                        }
                    }
                }
            }
        }
    });
    
    return chartInstanceRef.current;
}

export function renderBarChart(canvasId, labels, data, colors, tooltipValues, chartInstanceRef) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#eee',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // [수정] 애니메이션 비활성화
            layout: { padding: { top: 30, bottom: 10 } }, 
            plugins: {
                title: { display: false },
                legend: { display: false },
                datalabels: {
                    color: '#444',
                    anchor: 'end',
                    align: 'top',
                    font: { weight: 'bold', size: 10 },
                    formatter: (value) => {
                        if (parseFloat(value) < 0.01) return null;
                        return value + '%';
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` 확률: ${tooltipValues[context.dataIndex]}`;
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, display: false },
                x: { 
                    grid: { display: false },
                    ticks: { font: { size: 11 } }
                }
            }
        }
    });

    return chartInstanceRef.current;
}