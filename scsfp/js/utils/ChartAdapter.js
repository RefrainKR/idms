/**
 * js/utils/ChartAdapter.js
 * Chart.js 라이브러리 래퍼 클래스
 *
 * [개선] destroy/recreate 대신 update() 사용으로 성능 최적화
 */
export class ChartAdapter {

    // 파이 차트 (수집 확률)
    static renderPieChart(canvasId, labels, data, colors, tooltipValues, chartInstanceRef) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // [개선] 기존 차트가 있으면 데이터만 업데이트
        if (chartInstanceRef.current) {
            const chart = chartInstanceRef.current;
            chart.data.labels = labels;
            chart.data.datasets[0].data = data;
            chart.data.datasets[0].backgroundColor = colors;
            // tooltipValues는 옵션 콜백에서 참조하므로 저장
            chart._tooltipValues = tooltipValues;
            chart.update('none'); // 애니메이션 없이 업데이트
            return chart;
        }

        const ctx = canvas.getContext('2d');
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
                animation: false,
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
                            label: (context) => {
                                const vals = context.chart._tooltipValues || tooltipValues;
                                return ` ${context.label}: ${vals[context.dataIndex]}`;
                            }
                        }
                    }
                }
            }
        });
        // tooltipValues 저장
        chartInstanceRef.current._tooltipValues = tooltipValues;
        return chartInstanceRef.current;
    }

    // 바 차트 (총 획득 수)
    static renderBarChart(canvasId, labels, data, colors, tooltipValues, chartInstanceRef) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // [개선] 기존 차트가 있으면 데이터만 업데이트
        if (chartInstanceRef.current) {
            const chart = chartInstanceRef.current;
            chart.data.labels = labels;
            chart.data.datasets[0].data = data;
            chart.data.datasets[0].backgroundColor = colors;
            chart._tooltipValues = tooltipValues;
            chart.update('none');
            return chart;
        }

        const ctx = canvas.getContext('2d');
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
                    legend: { display: false },
                    datalabels: {
                        color: '#444',
                        anchor: 'end',
                        align: 'top',
                        font: { weight: 'bold', size: 10 },
                        formatter: (value) => (parseFloat(value) < 0.01 ? null : value + '%')
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const vals = context.chart._tooltipValues || tooltipValues;
                                return ` 확률: ${vals[context.dataIndex]}`;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, display: false },
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } }
                }
            }
        });
        chartInstanceRef.current._tooltipValues = tooltipValues;
        return chartInstanceRef.current;
    }

    // 라인 차트 (효율 비교 - 10단위 인터랙션 최적화 포함)
    static renderLineChart(canvasId, labels, datasets, chartInstanceRef) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // [개선] 기존 차트가 있으면 데이터만 업데이트
        if (chartInstanceRef && chartInstanceRef.current) {
            const chart = chartInstanceRef.current;
            chart.data.labels = labels;
            chart.data.datasets = datasets;
            chart.update('none');
            return chart;
        }

        const ctx = canvas.getContext('2d');
        chartInstanceRef.current = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,

                // [핵심] 10단위 터치 최적화 (Intersect + Index 모드)
                interaction: {
                    mode: 'index',
                    intersect: true
                },

                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12 } },
                    datalabels: { display: false },
                    tooltip: {
                        filter: (item) => Number(item.label) % 5 === 0,
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label.split(' ')[0] || '';
                                return ` ${label}: ${context.raw}%`;
                            },
                            footer: (items) => {
                                if (items.length < 2) return '';
                                const v1 = parseFloat(items[0].raw);
                                const v2 = parseFloat(items[1].raw);
                                const diff = (v1 - v2).toFixed(3);
                                return ` 차이: ${diff}%p`;
                            }
                        },
                        footerFont: { weight: 'bold', size: 12 },
                        footerColor: '#45a247'
                    }
                },
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + '%' } },
                    x: {
                        title: { display: true, text: '가챠 횟수' },
                        grid: { display: false },
                        ticks: {
                            maxTicksLimit: 21,
                            callback: function(val) {
                                const label = this.getLabelForValue(val);
                                return Number(label) % 20 === 0 ? label : '';
                            }
                        }
                    }
                }
            }
        });
        return chartInstanceRef.current;
    }
}
