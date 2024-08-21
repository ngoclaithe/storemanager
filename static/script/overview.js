const fetchData = async (url) => {
    const response = await fetch(url);
    return response.json();
};

const updateSalesData = async () => {
    const data = await fetchData('/sales_today');
    document.getElementById('sold-today').innerText = data.sold_today;
    document.getElementById('revenue-today').innerText = data.revenue_today;
    document.getElementById('sold-product').innerText = data.sold_product;
    document.getElementById('revenue-yesterday').innerText = data.revenue_yesterday;
};

const updateSalesChart = async () => {
    const salesData = await fetchData('/sales_week');
    renderChart(salesData);
};

const renderChart = (salesData) => {
    const ctx = document.getElementById('salesChart').getContext('2d');
    const labels = salesData.map(item => item.date);
    const totalQuantitySold = salesData.map(item => item.total_quantity_sold);
    const totalProductsSold = salesData.map(item => item.total_products_sold);
    const maxQuantity = Math.max(...totalQuantitySold);
    const maxProduct = Math.max(...totalProductsSold);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line',
                    label: 'Tổng số lượng bán',
                    data: totalQuantitySold,
                    backgroundColor: 'rgba(75, 192, 192, 0.3)', 
                    borderColor: 'rgba(75, 192, 192, 1)', 
                    borderWidth: 2, 
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)', 
                    pointBorderColor: '#fff', 
                    pointBorderWidth: 1, 
                    pointRadius: 5, 
                    fill: true,
                    tension: 0.8, 
                },
                {
                    type: 'bar',
                    label: 'Số loại sản phẩm bán',
                    data: totalProductsSold,
                    backgroundColor: 'rgba(0, 255, 0, 0.6)',
                    borderColor: 'rgba(0, 255, 0, 1)', 
                    borderWidth: 1, 
                    yAxisID: 'y2'
                }
            ]
        },
        options: {
            scales: {
                y1: {
                    type: 'linear',
                    position: 'left',
                    min: 0,
                    max: maxQuantity,
                    title: {
                        display: true,
                        text: 'Tổng số lượng bán'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)', 
                        borderColor: 'rgba(0, 0, 0, 0.1)' 
                    }
                },
                y2: {
                    type: 'linear',
                    position: 'right',
                    min: 0,
                    max: maxProduct,
                    title: {
                        display: true,
                        text: 'Số loại sản phẩm bán'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Ngày'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += `${context.raw}`;
                            return label;
                        }
                    }
                },
                legend: {
                    labels: {
                        font: {
                            size: 14 
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    backgroundColor: '#000',
                    borderRadius: 4,
                    anchor: 'end',
                    align: 'top',
                    formatter: (value) => {
                        return value;
                    }
                }
            },
            animation: {
                duration: 1000, 
                easing: 'easeInOutQuad' 
            },
            layout: {
                padding: {
                    left: 10,
                    right: 10,
                    top: 10,
                    bottom: 10
                }
            }
        }
    });
};

const renderPieChart = (data, chartId, label) => {
    const ctx = document.getElementById(chartId).getContext('2d');
    const labels = Object.keys(data);
    const quantities = labels.map(label => data[label].quantity);
    const percentages = labels.map(label => data[label].percentage.toFixed(2));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: percentages,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ],
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += `${context.raw}% (${quantities[context.dataIndex]} sản phẩm)`;
                            return label;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        },
        plugins: [{
            beforeDraw: (chart) => {
                chart.ctx.save();
                chart.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                chart.ctx.shadowBlur = 10;
                chart.ctx.shadowOffsetX = 0;
                chart.ctx.shadowOffsetY = 5;
            },
            afterDraw: (chart) => {
                chart.ctx.restore();
            }
        }]
    });
};

const updateGroupProductData = async () => {
    const data = await fetchData('/best_selling_group_products');
    renderPieChart(data.current_week, 'currentWeekChart', 'Tuần hiện tại');
    renderPieChart(data.last_week, 'lastWeekChart', 'Tuần trước');
};

document.getElementById('toggleSidebar').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    sidebar.classList.toggle('collapsed');
    content.classList.toggle('collapsed');
});

window.onload = () => {
    updateSalesData();
    updateSalesChart();
    updateGroupProductData();
};