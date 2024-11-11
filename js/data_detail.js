// 获取数据指标的显示名称
const metricLabels = {
    overall_impressions: '整体展现次数',
    overall_clicks: '整体点击次数',
    overall_ctr: '整体点击率',
    overall_conversion_rate: '整体转化率',
    overall_orders: '整体成交订单数',
    overall_sales: '整体成交金额',
    overall_spend: '整体消耗',
    spend_percentage: '整体消耗占比',
    basic_spend: '基础消耗',
    roi: '整体支付ROI',
    cost_per_order: '整体成交订单成本'
};

// 初始化 ECharts 实例
let chartInstance = null;

// 获取素材详细数据
async function fetchMaterialData(id) {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/Echony/echony-data-storage/main/data/ids/${id}.json`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching material data:', error);
        return null;
    }
}

// 更新数据概览区域
function updateOverview(currentData, previousData) {
    const overviewDiv = document.getElementById('overviewData');
    const metrics = Object.keys(metricLabels);
    
    const overviewHtml = metrics.map(metric => {
        const currentValue = currentData[metric];
        const previousValue = previousData ? previousData[metric] : 0;
        const change = previousValue ? ((currentValue - previousValue) / previousValue * 100) : 0;
        const changeClass = change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-muted';
        const changeIcon = change > 0 ? '↑' : change < 0 ? '↓' : '-';
        const changeText = change !== 0 ? `${Math.abs(change).toFixed(2)}%` : '-';

        return `
            <div class="col-md-3 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted">${metricLabels[metric]}</h6>
                        <h5 class="card-title mb-2">${formatValue(currentValue, metric)}</h5>
                        <small class="${changeClass}">
                            ${changeIcon} ${changeText}
                        </small>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    overviewDiv.innerHTML = overviewHtml;
}

// 更新趋势图表
function updateChart(data, metric1, metric2) {
    if (!chartInstance) {
        chartInstance = echarts.init(document.getElementById('trendChart'));
    }

    const dates = data.map(item => formatDate(item.record_date));
    const values1 = data.map(item => item[metric1]);
    const values2 = data.map(item => item[metric2]);

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        legend: {
            data: [metricLabels[metric1], metricLabels[metric2]]
        },
        grid: {
            right: '20%'
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: [
            {
                type: 'value',
                name: metricLabels[metric1],
                position: 'left'
            },
            {
                type: 'value',
                name: metricLabels[metric2],
                position: 'right'
            }
        ],
        series: [
            {
                name: metricLabels[metric1],
                type: 'line',
                data: values1,
                yAxisIndex: 0,
                smooth: true
            },
            {
                name: metricLabels[metric2],
                type: 'line',
                data: values2,
                yAxisIndex: 1,
                smooth: true
            }
        ]
    };

    chartInstance.setOption(option);
}

// 更新详细数据表格
function updateDetailTable(data) {
    const tableBody = document.getElementById('detailTableBody');
    
    // 格式化百分比的函数
    const formatPercentage = (value) => {
        const percentage = value * 100;
        return percentage < 1 ? '0%' : `${Math.round(percentage)}%`;
    };
    
    tableBody.innerHTML = data.map(item => `
        <tr>
            <td>${formatDate(item.record_date)}</td>
            <td>${item.status}</td>
            <td>${item.overall_impressions.toLocaleString()}</td>
            <td>${item.overall_clicks.toLocaleString()}</td>
            <td>${formatPercentage(item.overall_ctr)}</td>
            <td>${formatPercentage(item.overall_conversion_rate)}</td>
            <td>${item.overall_orders}</td>
            <td>${item.overall_sales.toFixed(2)}</td>
            <td>${item.overall_spend.toFixed(2)}</td>
            <td>${formatPercentage(item.spend_percentage)}</td>
            <td>${item.basic_spend.toFixed(2)}</td>
            <td>${item.roi.toFixed(2)}</td>
            <td>${item.cost_per_order.toFixed(2)}</td>
        </tr>
    `).join('');
}
// 格式化日期（完整格式：用于表格显示）
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 格式化数值显示// 格式化数值显示
function formatValue(value, metric) {
    if (typeof value !== 'number') return '-';
    
    // 处理百分比类型的数据
    if (metric.includes('percentage') || metric.includes('rate') || metric === 'ctr') {
        const percentage = value * 100;
        return percentage < 1 ? '0%' : `${Math.round(percentage)}%`;
    }
    
    // 处理金额类型的数据
    if (metric.includes('spend') || metric.includes('sales') || metric === 'cost_per_order') {
        return '¥' + value.toFixed(2);
    }
    
    // 处理ROI
    if (metric === 'roi') {
        return value.toFixed(2);
    }
    
    // 处理其他数值类型
    return value.toLocaleString();
}

// 初始化页面
async function initPage() {
    // 获取 URL 参数中的 ID
    const urlParams = new URLSearchParams(window.location.search);
    const materialId = urlParams.get('id');

    if (!materialId) {
        alert('未找到素材ID');
        return;
    }

    // 获取数据
    const materialData = await fetchMaterialData(materialId);
    if (!materialData) {
        alert('数据加载失败');
        return;
    }

    // 获取最新两条记录用于计算变化
    const currentData = materialData.data[0];
    const previousData = materialData.data[1];

    // 更新数据概览
    updateOverview(currentData, previousData);

    // 更新趋势图表
    const metric1 = document.getElementById('metric1').value;
    const metric2 = document.getElementById('metric2').value;
    updateChart(materialData.data.reverse(), metric1, metric2);

    // 更新详细数据表格
    updateDetailTable(materialData.data);

    // 添加指标选择事件监听
    document.getElementById('metric1').addEventListener('change', () => {
        const metric1 = document.getElementById('metric1').value;
        const metric2 = document.getElementById('metric2').value;
        updateChart(materialData.data, metric1, metric2);
    });

    document.getElementById('metric2').addEventListener('change', () => {
        const metric1 = document.getElementById('metric1').value;
        const metric2 = document.getElementById('metric2').value;
        updateChart(materialData.data, metric1, metric2);
    });

    // 监听窗口大小变化，调整图表大小
    window.addEventListener('resize', () => {
        chartInstance && chartInstance.resize();
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);

// 格式化日期（只显示时分：用于图表显示）
function formatTimeOnly(dateString) {
    const date = new Date(dateString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 更新趋势图表
function updateChart(data, metric1, metric2) {
    if (!chartInstance) {
        chartInstance = echarts.init(document.getElementById('trendChart'));
    }

    const dates = data.map(item => formatTimeOnly(item.record_date));
    const values1 = data.map(item => item[metric1]);
    const values2 = data.map(item => item[metric2]);

    // 图表配色方案
    const colors = ['#3498db', '#2ecc71'];

    const option = {
        color: colors,
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'line',
                lineStyle: {
                    color: '#666',
                    width: 1,
                    type: 'dashed'
                }
            },
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#eee',
            borderWidth: 1,
            textStyle: {
                color: '#333'
            },
            formatter: function(params) {
                const date = new Date(data[params[0].dataIndex].record_date);
                const fullDate = formatDate(date);
                let result = `<div style="padding: 3px 6px;">
                    <div style="margin-bottom: 4px;font-weight:bold;">${fullDate}</div>`;
                params.forEach((param, index) => {
                    result += `
                        <div style="display:flex;justify-content:space-between;align-items:center;min-width:180px;">
                            <span>
                                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${colors[index]};margin-right:6px;"></span>
                                ${param.seriesName}
                            </span>
                            <span style="font-weight:bold;">${formatValue(param.value, param.seriesName.includes('率') || param.seriesName.includes('比') ? 'percentage' : 'number')}</span>
                        </div>`;
                });
                result += '</div>';
                return result;
            }
        },
        legend: {
            data: [metricLabels[metric1], metricLabels[metric2]],
            icon: 'circle',
            textStyle: {
                fontSize: 12
            },
            itemGap: 25,
            top: 0
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '8%',
            top: '8%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            boundaryGap: false,
            axisLine: {
                lineStyle: {
                    color: '#ddd'
                }
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                rotate: 45,
                margin: 12,
                color: '#666',
                fontSize: 11
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: ['#f5f5f5'],
                    width: 1,
                    type: 'dashed'
                }
            }
        },
        yAxis: [
            {
                type: 'value',
                name: metricLabels[metric1],
                position: 'left',
                nameTextStyle: {
                    color: colors[0],
                    fontSize: 12,
                    padding: [0, 0, 0, -50]  // 调整名称位置
                },
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: colors[0]
                    }
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    color: '#666',
                    fontSize: 11,
                    formatter: function(value) {
                        return formatValue(value, metric1.includes('rate') || metric1.includes('percentage') ? 'percentage' : 'number');
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: ['#f5f5f5'],
                        type: 'dashed'
                    }
                }
            },
            {
                type: 'value',
                name: metricLabels[metric2],
                position: 'right',
                nameTextStyle: {
                    color: colors[1],
                    fontSize: 12,
                    padding: [0, -50, 0, 0]  // 调整名称位置
                },
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: colors[1]
                    }
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    color: '#666',
                    fontSize: 11,
                    formatter: function(value) {
                        return formatValue(value, metric2.includes('rate') || metric2.includes('percentage') ? 'percentage' : 'number');
                    }
                },
                splitLine: {
                    show: false
                }
            }
        ],
        series: [
            {
                name: metricLabels[metric1],
                type: 'line',
                data: values1,
                yAxisIndex: 0,
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                    width: 3,
                    shadowColor: 'rgba(52,152,219,0.3)',
                    shadowBlur: 10
                },
                itemStyle: {
                    borderWidth: 2,
                    borderColor: '#fff'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(52,152,219,0.3)' },
                        { offset: 1, color: 'rgba(52,152,219,0.1)' }
                    ])
                }
            },
            {
                name: metricLabels[metric2],
                type: 'line',
                data: values2,
                yAxisIndex: 1,
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                    width: 3,
                    shadowColor: 'rgba(46,204,113,0.3)',
                    shadowBlur: 10
                },
                itemStyle: {
                    borderWidth: 2,
                    borderColor: '#fff'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(46,204,113,0.3)' },
                        { offset: 1, color: 'rgba(46,204,113,0.1)' }
                    ])
                }
            }
        ]
    };

    chartInstance.setOption(option);
}

// 添加数值格式化函数
function formatValue(value, type) {
    if (type === 'percentage') {
        const percentage = Number(value) * 100;
        return percentage < 1 ? '0%' : `${Math.round(percentage)}%`;
    }
    return value.toLocaleString();
}