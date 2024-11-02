async function fetchDataAndDisplay() {
  try {
    // 请求 GitHub Pages 上的 data.json 文件
    const response = await fetch('/data.json?' + new Date().getTime());
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // 解析 JSON 数据
    const data = await response.json();

    // 找到页面中的数据展示区域
    const dataContainer = document.getElementById('data-container');
    const chartContainer = document.getElementById('chart-container');
    if (!dataContainer || !chartContainer) {
      console.error("数据展示区域未找到");
      return;
    }

    // 展示最新一条数据（如 ROI 值等关键信息）
    const latestData = data[0];
    dataContainer.innerHTML = `
      <p>ID: ${latestData.ID}</p>
      <p>ROI: ${latestData.roi}</p>
      <p>总体点击量: ${latestData.overall_clicks}</p>
      <p>总体展示次数: ${latestData.overall_impressions}</p>
      <p>更新时间: ${latestData.record_date}</p>
    `;

    // 用 Chart.js 显示 ROI 数据的变化
    const ctx = document.getElementById('roiChart').getContext('2d');
    const roiData = data.map(item => item.roi);
    const labels = data.map(item => item.record_date);
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'ROI 变化趋势',
          data: roiData,
          fill: false,
          borderColor: 'blue',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: '时间'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'ROI'
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('数据加载失败:', error);
  }
}

// 页面加载时自动调用
window.onload = fetchDataAndDisplay;
