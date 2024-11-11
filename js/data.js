// 状态常量
const STATUS_LIST = [
    '跑量素材',
    '跑量素材-阶段放弃',
    '投放中',
    '投放中-阶段放弃',
    '一轮测试',
    '一阶段测试-暂停',
    '二阶段刺激'
];

// 初始化状态按钮
function initStatusButtons() {
    const statusButtons = document.getElementById('statusButtons');
    statusButtons.innerHTML = STATUS_LIST.map(status => `
        <button class="status-btn" data-status="${status}">
            ${status}
        </button>
    `).join('');

    // 添加点击事件
    statusButtons.addEventListener('click', (e) => {
        if (e.target.classList.contains('status-btn')) {
            // 移除其他按钮的激活状态
            document.querySelectorAll('.status-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            // 激活当前按钮
            e.target.classList.add('active');
            // 获取并过滤数据
            loadDataByStatus(e.target.dataset.status);
        }
    });

    // 默认选中第一个状态
    statusButtons.querySelector('.status-btn').click();
}

// 从 GitHub 获取数据
async function fetchData() {
    try {
        // 获取索引文件
        const indexResponse = await fetch('https://raw.githubusercontent.com/Echony/echony-data-storage/main/data/index.json');
        const indexData = await indexResponse.json();
        return indexData;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// 根据状态加载数据
async function loadDataByStatus(status) {
    const data = await fetchData();
    if (!data) {
        alert('数据加载失败，请稍后重试');
        return;
    }

    // 过滤符合状态的数据
    const filteredMaterials = data.materials.filter(m => m.current_status === status);
    
    // 更新表格
    updateTable(filteredMaterials);
}

// 更新表格数据
// 更新表格数据
async function updateTable(materials) {
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = ''; // 清空现有数据

    for (const material of materials) {
        try {
            const response = await fetch(`https://raw.githubusercontent.com/Echony/echony-data-storage/main/data/ids/${material.id}.json`);
            const detailData = await response.json();
            
            // 使用最新的数据记录
            const latestData = detailData.data[0];
            
            // 格式化百分比数据的函数
            const formatPercentage = (value) => {
                const percentage = value * 100;
                return percentage < 1 ? '0%' : `${Math.round(percentage)}%`;
            };
            
            // 创建表格行
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${material.id}</td>
                <td>${material.current_status}</td>
                <td>${latestData.overall_impressions.toLocaleString()}</td>
                <td>${latestData.overall_clicks.toLocaleString()}</td>
                <td>${formatPercentage(latestData.overall_ctr)}</td>
                <td>${formatPercentage(latestData.overall_conversion_rate)}</td>
                <td>${latestData.overall_orders}</td>
                <td>${latestData.overall_sales.toFixed(2)}</td>
                <td>${latestData.overall_spend.toFixed(2)}</td>
                <td>${formatPercentage(latestData.spend_percentage)}</td>
                <td>${latestData.basic_spend.toFixed(2)}</td>
                <td>${latestData.roi.toFixed(2)}</td>
                <td>${latestData.cost_per_order.toFixed(2)}</td>
            `;
            
            // 添加点击事件，跳转到详情页
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                window.location.href = `/data/detail.html?id=${material.id}`;
            });
            
            tableBody.appendChild(row);
        } catch (error) {
            console.error(`Error loading data for ID ${material.id}:`, error);
        }
    }
}

// 初始化搜索功能
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    let timeout = null;

    searchInput.addEventListener('input', (e) => {
        // 清除之前的定时器
        if (timeout) {
            clearTimeout(timeout);
        }

        // 设置新的定时器，延迟 300ms 执行搜索
        timeout = setTimeout(() => {
            const searchValue = e.target.value.trim();
            if (searchValue === '') {
                // 如果搜索框为空，显示当前选中状态的所有数据
                const activeStatus = document.querySelector('.status-btn.active').dataset.status;
                loadDataByStatus(activeStatus);
            } else {
                // 否则根据 ID 搜索
                searchById(searchValue);
            }
        }, 300);
    });
}

// 根据 ID 搜索数据
async function searchById(id) {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/Echony/echony-data-storage/main/data/ids/${id}.json`);
        const detailData = await response.json();
        updateTable([{ id: detailData.id, current_status: detailData.current_status }]);
    } catch (error) {
        console.error('Error searching by ID:', error);
        // 如果找不到数据，清空表格
        document.getElementById('dataTableBody').innerHTML = '';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initStatusButtons();
    initSearch();
}); 