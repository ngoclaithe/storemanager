$(function () {
    $("#dateInput").datepicker({
        dateFormat: "yy-mm-dd"
    });
});

window.onload = function () {
    var moreActionsButtons = document.querySelectorAll('.room button');
    var currentRoomId, currentNameRoom;

    moreActionsButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            currentRoomId = this.getAttribute('data-room-id');
            currentNameRoom = this.getAttribute('data-room-name');
            console.log('Room ID:', currentRoomId);
            console.log('Current Name:', currentNameRoom);

            var modal = document.getElementById('myModal');
            if (modal) {
                modal.style.display = "block";
                document.getElementById('roomIdInput').value = currentRoomId;
                document.getElementById('morningTable').classList.add('hidden');
                document.getElementById('afternoonTable').classList.add('hidden');
            }
        });
    });

    var submitBtn = document.getElementById('submitBtn');
    submitBtn.addEventListener('click', function (event) {
        event.preventDefault();
        var actionType = document.querySelector('input[name="action"]:checked').value;
        var form = document.getElementById('modalForm');
        if (actionType == 'update') {
            var formData = new FormData();
            formData.append('id_room', document.getElementById('roomIdInput').value);
            formData.append('name', document.getElementById('nameInput').value);
            formData.append('type', document.getElementById('typeInput').value);
            formData.append('slot', document.getElementById('slotInput').value);
            formData.append('device', document.getElementById('deviceInput').value);
            console.log(formData);
            fetch('/update', {
                method: 'POST',
                body: formData

            }).then(response => {
                if (response.status === 200) {
                    alert('Đã cập nhật thông tin phòng', 'success');
                    location.reload();
                } else {
                    console.error('Failed to update');
                }
            }).catch(error => {
                console.error('Error:', error);
            });

        } else if (actionType == 'updatestateroom') {
            var formData = new FormData();
            formData.append('id_room', document.getElementById('roomIdInput').value);
            formData.append('state', document.getElementById('stateSelect').value);
            fetch('/updatestateroom', {
                method: 'POST',
                body: formData

            }).then(response => {
                if (response.status === 200) {
                    alert('Đã cập nhật trạng thái phòng', 'success');
                    location.reload();
                } else {
                    console.error('Failed to update');
                }
            }).catch(error => {
                console.error('Error:', error);
            });
        } else if (actionType == 'delete') {
            var formData = new FormData();
            formData.append('id_room', document.getElementById('roomIdInput').value);
            formData.append('id_room', document.getElementById('roomIdInput').value);
            fetch('/delete', {
                method: 'POST',
                body: formData

            }).then(response => {
                if (response.status === 200) {
                    alert('Đã xóa thông tin phòng', 'success');
                    location.reload();
                } else {
                    console.error('Failed to update');
                }
            }).catch(error => {
                console.error('Error:', error);
            });
        } else if (actionType == 'status') {
            var formData = new FormData();
            formData.append('name', currentNameRoom);
            formData.append('date', document.getElementById('dateInput').value);
            fetch('/status_room', {
                method: 'POST',
                body: formData
            }).then(response => {
                if (response.status === 200) {
                    return response.json();
                } else if (response.status === 404) {
                    document.getElementById('morningTable').classList.add('hidden');
                    document.getElementById('afternoonTable').classList.add('hidden');
                    console.error('No data found');
                    return null;
                } else {
                    console.error('Failed to update');
                }
            }).then(data => {
                if (data) {

                    document.getElementById('morningTable').classList.add('hidden');
                    document.getElementById('afternoonTable').classList.add('hidden');

                    data.forEach(record => {
                        if (record.session === 'sáng') {
                            document.getElementById('morningIdRegister').innerText = record.id_register;
                            document.getElementById('morningTeacher').innerText = record.teacher;
                            document.getElementById('morningSubject').innerText = record.subject;
                            document.getElementById('morningTable').classList.remove('hidden');
                        } else if (record.session === 'chiều') {
                            document.getElementById('afternoonIdRegister').innerText = record.id_register;
                            document.getElementById('afternoonTeacher').innerText = record.teacher;
                            document.getElementById('afternoonSubject').innerText = record.subject;
                            document.getElementById('afternoonTable').classList.remove('hidden');
                        }
                    });
                }
            }).catch(error => {
                console.error('Error:', error);
                document.getElementById('morningTable').classList.add('hidden');
                document.getElementById('afternoonTable').classList.add('hidden');
            });
        }
    });

    var modal = document.getElementById('myModal');
    var span = document.getElementsByClassName("close")[0];
    span.onclick = function () {
        modal.style.display = "none";
    }
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    var addRoomBtn = document.getElementById('addRoomBtn');
    var addRoomModal = document.getElementById('addRoomModal');
    var closeAddRoomModal = addRoomModal.getElementsByClassName('close')[0];

    addRoomBtn.onclick = function () {
        addRoomModal.style.display = "block";
    }

    closeAddRoomModal.onclick = function () {
        addRoomModal.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == addRoomModal) {
            addRoomModal.style.display = "none";
        }
    }
    var addRoomForm = document.getElementById('addRoomForm');
    addRoomForm.addEventListener('submit', function (event) {
        event.preventDefault();

        var formData = new FormData(addRoomForm);

        fetch('/add_room', {
            method: 'POST',
            body: formData
        }).then(response => {
            if (response.status === 200) {
                alert("Đã thêm phòng!!");
                location.reload();
            } else {
                console.error('Failed to add room');
            }
        }).catch(error => {
            console.error('Error:', error);
        });
    });
    var filterRoomBtn = document.getElementById('filterRoomBtn');
    var filterRoomModal = document.getElementById('filterRoomModal');
    var closeFilterRoomModal = filterRoomModal.getElementsByClassName('close')[0];

    filterRoomBtn.onclick = function () {
        filterRoomModal.style.display = "block";
    }

    closeFilterRoomModal.onclick = function () {
        filterRoomModal.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == filterRoomModal) {
            filterRoomModal.style.display = "none";
        }
    }
    var filterRoomForm = document.getElementById('filterRoomForm');
    filterRoomForm.addEventListener('submit', function (event) {
        event.preventDefault();
        var filterState = document.getElementById('filterState').value;
        var filterName = document.getElementById('filterName').value;
        console.log(filterState);
        if (filterState == "all") {
            var rooms = document.querySelectorAll('.room');
            rooms.forEach(function (room) {
                room.style.display = "block";
            });
            return;
        }
        if (filterState == "open") {
            filterState = "Mở";
        } else if (filterState == "close") {
            filterState = "Khóa";
        }
        var rooms = document.querySelectorAll('.room');
        rooms.forEach(function (room) {
            var roomState = room.querySelector('p:nth-of-type(6)').innerText.trim().split(': ')[1];
            var roomName = room.querySelector('p:nth-of-type(1)').innerText.trim().split(': ')[1];
            console.log(roomState);
            console.log(filterState);
            console.log(roomName);
            console.log(filterName);
            if ((roomState == filterState || filterState == 'all') && (roomName.includes(filterName) || filterName === '')) {
                room.style.display = "block";
            } else {
                room.style.display = "none";
            }
        });
    });
};
