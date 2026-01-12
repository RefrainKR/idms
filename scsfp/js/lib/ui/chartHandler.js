
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
                borderColor: '#bbdefb',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
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

export function renderLineChart(canvasId, labels, datasets, chartInstanceRef) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: {
                mode: 'nearest', 
                axis: 'x',
                intersect: true // 중요: 마우스가 HitRadius 안에 들어와야만 툴팁 표시
            },
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12 } },
                datalabels: { display: false },
                tooltip: {
                    // [핵심] 10회 단위가 아니면 툴팁을 아예 렌더링하지 않음
                    filter: function(tooltipItem) {
                        return Number(tooltipItem.label) % 10 === 0;
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label.split(' ')[0] || '';
                            return ` ${label}: ${context.raw}%`;
                        },
                        footer: function(tooltipItems) {
                            if (tooltipItems.length < 2) return '';
                            const stepVal = parseFloat(tooltipItems[0].raw);
                            const normVal = parseFloat(tooltipItems[1].raw);
                            const diff = (stepVal - normVal).toFixed(2);
                            return ` 차이: ${diff}%p`;
                        }
                    },
                    footerFont: { weight: 'bold' },
                    footerColor: '#45a247'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: (value) => value + '%' }
                },
                x: {
                    type: 'linear', // 선형 축 사용 (데이터가 숫자일 때)
                    min: 0,
                    max: 200,
                    ticks: {
                        stepSize: 20 // 20단위로 눈금 고정 (0, 20, 40...)
                    },
                    title: { display: true, text: '가챠 횟수' },
                    grid: { display: false }
                }
            }
        }
    });
}