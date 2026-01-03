export function renderChart(canvasId, labels, data, colors, tooltipValues, chartInstanceRef) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // 기존 차트 파괴
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
            layout: { padding: 10 },
            plugins: {
                title: { display: false },
                legend: { display: false },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 14 },
                    formatter: (value, context) => {
                        if (value < 3) return null;
                        const label = context.chart.data.labels[context.dataIndex];
                        return `${label}\n${value}%`;
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