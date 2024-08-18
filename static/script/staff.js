document.getElementById('reportSelect').addEventListener('change', function () {
    var selectedEndpoint = this.value;
    var staffSelect = document.getElementById('staffSelect');
    var staffTable = document.getElementById('staff-table');
    var salaryTable = document.getElementById('salary-table');
    var calendar = document.getElementById('calendar');
    var addStaffBtn = document.getElementById('add-staff-btn');
    var dayfromdayto = document.getElementById('dayfromdayto');
    if (selectedEndpoint === '/list_staff') {
        fetch(selectedEndpoint)
            .then(response => response.json())
            .then(data => {
                var tableBody = document.getElementById('staffTableBody');
                tableBody.innerHTML = '';
                data.forEach(staff => {
                    var row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${staff.id_staff}</td>
                        <td>${staff.name_staff}</td>
                        <td>${staff.date_birth}</td>
                        <td>${staff.home_town}</td>
                        <td>${staff.type_staff}</td>
                        <td>${staff.phone}</td>
                    `;
                    tableBody.appendChild(row);
                });
                staffTable.style.display = 'block';
                addStaffBtn.style.display = 'flex';
                staffSelect.style.display = 'none';
                salaryTable.style.display = 'none';
                calendar.style.display = 'none';
                dayfromdayto.style.display = 'none';
            })
            .catch(error => console.error('Error:', error));
    } else if (selectedEndpoint === '/time_keeping') {
        fetch('/search_staff')
            .then(response => response.json())
            .then(data => {
                staffSelect.innerHTML = '<option value="">Chọn nhân viên</option>';
                data.forEach(staff => {
                    var option = document.createElement('option');
                    option.value = staff.id_staff;
                    option.textContent = staff.name_staff;
                    staffSelect.appendChild(option);
                });
                staffSelect.style.display = 'inline-block';
                staffTable.style.display = 'none';
                calendar.style.display = 'none';
                salaryTable.style.display = 'none';
                addStaffBtn.style.display = 'none';
                dayfromdayto.style.display = 'none';
            })
            .catch(error => console.error('Error:', error));
    } else if (selectedEndpoint === '/salary_staff') {
        staffTable.style.display = 'none';
        addStaffBtn.style.display = 'none';
        staffSelect.style.display = 'none';
        calendar.style.display = 'none';
        dayfromdayto.style.display = 'block';
        document.getElementById('searchButton').addEventListener('click', function () {
            var from_day = document.getElementById('from_day').value;
            var to_day = document.getElementById('to_day').value;

            if (!from_day || !to_day) {
                alert('Vui lòng chọn cả hai ngày.');
                return;
            }

            var fromDate = new Date(from_day);
            var toDate = new Date(to_day);
            var timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (diffDays > 30) {
                alert('Phạm vi ngày không được quá 30 ngày. Vui lòng chọn lại.');
                return;
            }

            fetch(`/salary_staff_calcu?dayfrom=${from_day}&dayto=${to_day}`)
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    var salaryTableHead = document.getElementById('salaryTableHead');
                    var salaryTableBody = document.getElementById('salaryTableBody');
                    // var totalShifts = document.getElementById('totalShifts');

                    salaryTableHead.innerHTML = '<tr><th>Tên</th></tr>';
                    salaryTableBody.innerHTML = '';
                    // totalShifts.innerHTML = '';
                    var dateList = Object.keys(data[0]).filter(key => key !== 'name_staff' && key !== 'total_shifts');
                    dateList.forEach(date => {
                        var th = document.createElement('th');
                        th.textContent = date;
                        salaryTableHead.querySelector('tr').appendChild(th);
                    });
                    var totalTh = document.createElement('th');
                    totalTh.textContent = 'Tổng ca làm';
                    salaryTableHead.querySelector('tr').appendChild(totalTh);


                    data.forEach(staff => {
                        var row = document.createElement('tr');
                        row.innerHTML = `<td>${staff.name_staff}</td>`;

                        var totalShift = 0;

                        dateList.forEach(date => {
                            var td = document.createElement('td');
                            td.textContent = staff[date] || 0;
                            totalShift += staff[date] || 0;
                            row.appendChild(td);
                        });

                        var totalTd = document.createElement('td');
                        totalTd.textContent = totalShift;
                        row.appendChild(totalTd);

                        salaryTableBody.appendChild(row);
                    });
                    salaryTable.style.display = 'block';
                })
                .catch(error => console.error('Error:', error));
        });
        document.getElementById('exportTable').addEventListener('click', function () {
            var table = document.querySelector('#salary-table table');
            var rows = table.querySelectorAll('tr');
            var csvContent = '';

            rows.forEach(function (row) {
                var cells = row.querySelectorAll('th, td');
                var rowArray = [];
                cells.forEach(function (cell) {
                    rowArray.push('"' + cell.textContent.replace(/"/g, '""') + '"');
                });
                csvContent += rowArray.join(',') + '\n';
            });

            var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            var link = document.createElement('a');
            if (link.download !== undefined) { // feature detection
                var url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'salary_table.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });


    }
});

document.getElementById('staffSelect').addEventListener('change', function () {
    var selectedStaffId = this.value;
    var calendar = document.getElementById('calendar');
    if (selectedStaffId) {
        fetch('/get_timekeeping/' + selectedStaffId)
            .then(response => response.json())
            .then(data => {

                var calendarBody = document.getElementById('calendarBody');
                calendarBody.innerHTML = '';

                var today = new Date();
                var firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

                var daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];


                var row = document.createElement('tr');
                for (var i = 0; i < daysOfWeek.length; i++) {
                    row.appendChild(document.createElement('th'));
                }
                calendarBody.appendChild(row);

                row = document.createElement('tr');
                var dayOfWeek = firstDay.getDay();
                for (var i = 0; i < dayOfWeek; i++) {
                    row.appendChild(document.createElement('td'));
                }

                for (var d = 1; d <= lastDay.getDate(); d++) {
                    var cell = document.createElement('td');
                    var currentDate = new Date(today.getFullYear(), today.getMonth(), d);
                    var dateString = currentDate.toISOString().split('T')[0];
                    var dateLabel = `${d}/${today.getMonth() + 1}/${today.getFullYear()}`;
                    var record = data.find(record => record.day === dateString);

                    var dateCell = document.createElement('div');
                    dateCell.className = 'date-cell';
                    dateCell.innerHTML = dateLabel;

                    if (record) {
                        var timekeeping = document.createElement('div');
                        timekeeping.className = 'timekeeping';
                        timekeeping.innerHTML = `${record.checkin} - ${record.checkout}`;
                        dateCell.appendChild(timekeeping);
                    }

                    cell.appendChild(dateCell);
                    row.appendChild(cell);
                    if (currentDate.getDay() === 6) {
                        calendarBody.appendChild(row);
                        row = document.createElement('tr');
                    }
                }

                while (row.children.length < 7) {
                    row.appendChild(document.createElement('td'));
                }
                calendarBody.appendChild(row);

                calendar.style.display = 'block';
            })
            .catch(error => console.error('Error:', error));
    }
});

document.getElementById('addStaffForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var formData = new FormData(this);
    fetch('/add_staff', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                $('#addStaffModal').modal('hide');
                alert(result.message);
                document.getElementById('reportSelect').dispatchEvent(new Event('change'));
            } else {
                alert('Có lỗi xảy ra: ' + result.message);
            }
        })
        .catch(error => console.error('Error:', error));
});

document.getElementById('add-staff-btn').addEventListener('click', function () {
    $('#addStaffModal').modal('show');
});
document.getElementById('toggleSidebar').addEventListener('click', function () {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    sidebar.classList.toggle('collapsed');
    content.classList.toggle('collapsed');
});
document.addEventListener('DOMContentLoaded', () => {
    const rowsPerPage = 5;
    const table = document.getElementById('salary-table');
    const tableBody = table.querySelector('tbody');
    const rows = tableBody.querySelectorAll('tr');

    function updatePagination() {
        const totalRows = rows.length;
        console.log(totalRows);
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
    }
    if (table) {
        updatePagination();
    }
});