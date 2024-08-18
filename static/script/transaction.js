function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}
// document.getElementById("exportExcelBtn").addEventListener("click", function () {
//     fetch('/export_product', {
//         method: 'GET'
//     })
//         .then(response => {
//             if (response.ok) {
//                 return response.blob(); 
//             } else {
//                 throw new Error("Xuất CSV không thành công.");
//             }
//         })
//         .then(blob => {
//             const url = window.URL.createObjectURL(blob);
//             const a = document.createElement('a');
//             a.href = url;
//             a.download = 'Baocaohanghoa.csv';
//             document.body.appendChild(a);
//             a.click();
//             a.remove(); 
//         })
//         .catch(error => {
//             console.error('Error:', error);
//             alert('Có lỗi xảy ra khi xuất file CSV.');
//         });
// });

document.addEventListener('DOMContentLoaded', () => {
    const rowsPerPage = 10;
    const table = document.getElementById('productTable');
    const rows = table.querySelectorAll('tbody tr');
    const totalRows = rows.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    let currentPage = 1;

    function showPage(page) {
        rows.forEach((row, index) => {
            if (index >= (page - 1) * rowsPerPage && index < page * rowsPerPage) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        document.getElementById('prevPageBtn').disabled = page === 1;
        document.getElementById('nextPageBtn').disabled = page === totalPages;
        document.getElementById('currentPage').textContent = `Trang ${page}`;
    }

    document.getElementById('prevPageBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            showPage(currentPage);
        }
    });

    document.getElementById('nextPageBtn').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            showPage(currentPage);
        }
    });

    showPage(currentPage);
});

function openNewTabExport() {
    window.open('/add_bill_export_page', '_blank');
}
function openNewTabImport() {
    window.open('/add_bill_import_page', '_blank');
}        
function deleteBill(billId) {
    fetch('/delete_bill', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_bill: billId }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert('Xóa hóa đơn thất bại');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}
document.getElementById('toggleSidebar').addEventListener('click', function () {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    sidebar.classList.toggle('collapsed');
    content.classList.toggle('collapsed');
});