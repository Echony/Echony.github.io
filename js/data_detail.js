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
    tableBody.innerHTML = data.map(item => `
        <tr>
            <td>${formatDate(item.record_date)}</td>
            <td>${item.status}</td>
            <td>${item.overall_impressions.toLocaleString()}</td>
            <td>${item.overall_clicks.toLocaleString()}</td>
            <td>${item.overall_ctr}%</td>
            <td>${item.overall_conversion_rate}%</td>
            <td>${item.overall_orders}</td>
            <td>${item.overall_sales.toFixed(2)}</td>
            <td>${item.overall_spend.toFixed(2)}</td>
            <td>${item.spend_percentage}%</td>
            <td>${item.basic_spend.toFixed(2)}</td>
            <td>${item.roi.toFixed(2)}</td>
            <td>${item.cost_per_order.toFixed(2)}</td>
        </tr>
    `).join('');
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 格式化数值显示
function formatValue(value, metric) {
    if (typeof value !== 'number') return '-';
    
    if (metric.includes('percentage') || metric.includes('rate') || metric === 'ctr') {
        return value.toFixed(2) + '%';
    }
    if (metric.includes('spend') || metric.includes('sales') || metric === 'cost_per_order') {
        return '¥' + value.toFixed(2);
    }
    if (metric === 'roi') {
        return value.toFixed(2);
    }
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