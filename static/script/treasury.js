function toggleReceiverSubmitter() {
    var typeTreasury = document.getElementById('type_treasury').value;
    if (typeTreasury === 'Chi tiền') {
        document.getElementById('receiver-group').style.display = 'block';
        document.getElementById('submitter-group').style.display = 'none';
    } else if (typeTreasury === 'Thu tiền') {
        document.getElementById('receiver-group').style.display = 'none';
        document.getElementById('submitter-group').style.display = 'block';
    } else {
        document.getElementById('receiver-group').style.display = 'none';
        document.getElementById('submitter-group').style.display = 'none';
    }
}

function submitForm() {
    var form = document.getElementById('treasuryForm');
    var formData = new FormData(form);

    var jsonObject = {};
    formData.forEach((value, key) => {
        jsonObject[key] = value;
    });

    fetch('/add_treasury', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonObject)
    }).then(response => {
        if (response.status === 200) {
            sessionStorage.setItem('toastr_success', 'Phiếu thu chi đã được lưu thành công!');
            sessionStorage.setItem('toastr_title', 'Thành công');
            location.reload();
        } else {
            toastr.error('Thêm phiếu thu chi thất bại','Thất bại');
        }
    }).catch(error => {
        console.error('Error:', error);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    toggleReceiverSubmitter();
});

document.getElementById("exportFile").addEventListener("click", function () {
    fetch('/exportfiletreasury', {
        method: 'GET'
    })
        .then(response => {
            if (response.ok) {
                toastr.success('Xuất CSV thành công', '');
                return response.blob();
            } else {
                toastr.error('Xuất CSV không thành công', '');
                throw new Error("Xuất CSV không thành công.");
                
            }
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Baocaosoquy.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch(error => {
            console.error('Error:', error);
            toastr.error('Có lỗi xảy ra khi xuất file CSV.', '', {timeOut: 3000})
        });
});

document.getElementById('toggleSidebar').addEventListener('click', function () {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    sidebar.classList.toggle('collapsed');
    content.classList.toggle('collapsed');
});
document.addEventListener('DOMContentLoaded', function () {
    const contextMenu = document.getElementById('contextMenu');
    let selectedTreasuryId = null;

    document.addEventListener('click', function () {
        contextMenu.style.display = 'none';
    });

    document.querySelectorAll('tr[data-id]').forEach(function (row) {
        row.addEventListener('contextmenu', function (event) {
            event.preventDefault();
            selectedTreasuryId = this.getAttribute('data-id');
            selectedRow = this;

            contextMenu.style.left = event.pageX + 'px';
            contextMenu.style.top = event.pageY + 'px';
            contextMenu.style.display = 'block';
        });
    });

    document.getElementById('editOption').addEventListener('click', function () {
        if (selectedRow) {
            const cells = selectedRow.querySelectorAll('td');
            const datetime = cells[1].textContent;
            const usercreate = cells[2].textContent;
            const typeTreasury = cells[3].textContent;
            const receiver = cells[4].textContent;
            const submitter = cells[5].textContent;
            const value = cells[6].textContent;
            const notes = cells[7].textContent;

            document.getElementById('edit_datetime').value = datetime;
            document.getElementById('edit_type_treasury').value = typeTreasury;
            document.getElementById('edit_user_create').value = usercreate;
            document.getElementById('edit_receiver').value = receiver;
            document.getElementById('edit_submitter').value = submitter;
            document.getElementById('edit_value').value = value;
            document.getElementById('edit_notes').value = notes;

            $('#editTreasuryModal').modal('show');
        }
    });

    window.updateForm = function () {
        const form = document.getElementById('editTreasuryForm');
        const formData = new FormData(form);

        const jsonObject = {};
        formData.forEach((value, key) => {
            jsonObject[key] = value;
        });
        console.log("Dữ liệu gửi đến API /update_treasury:", JSON.stringify(jsonObject));

        fetch(`/update_treasury/${selectedTreasuryId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonObject)
        }).then(response => {
            if (response.status === 200) {
                sessionStorage.setItem('toastr_success', 'Phiếu thu chi đã được cập nhất thành công!');
                sessionStorage.setItem('toastr_title', 'Thành công');
                location.reload();
            } else {
                toastr.info('Cập nhật phiếu thu chi thất bại','Thông tin');
            }
        }).catch(error => {
            console.error('Error:', error);
        });
    };

    document.getElementById('deleteOption').addEventListener('click', function () {
        if (selectedTreasuryId) {
            if (confirm('Bạn có chắc chắn muốn xóa phiếu thu chi này?')) {
                fetch(`/delete_treasury/${selectedTreasuryId}`, {
                    method: 'DELETE'
                }).then(response => {
                    if (response.status === 200) {
                        sessionStorage.setItem('toastr_success', 'Phiếu thu chi đã được lưu thành công!');
                        sessionStorage.setItem('toastr_title', 'Thành công');
                        location.reload();
                    } else {
                        toastr.info('Xóa phiếu thu chi thất bại','Thông tin');
                    }
                }).catch(error => {
                    console.error('Error:', error);
                });
            }
        }
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const rowsPerPage = 5;
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

