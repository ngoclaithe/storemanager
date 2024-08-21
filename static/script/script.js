document.addEventListener('DOMContentLoaded', () => {
    const notificationIcon = document.getElementById('notification-icon');
    const notificationPopup = document.getElementById('notification-popup');
    let isPopupVisible = false;

    notificationIcon.addEventListener('click', async () => {
        if (isPopupVisible) {
            notificationPopup.style.display = 'none';
            isPopupVisible = false;
        } else {
            notificationPopup.style.display = 'block';
            isPopupVisible = true;

            try {
                const response = await fetch('/notification');
                const notifications = await response.json();

                const notificationBody = document.getElementById('notification-body');
                notificationBody.innerHTML = ''; 

                notifications.forEach(notification => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><img src="${notification.path_image}" alt="Overview Image" class="overview-img"></td>
                        <td>${notification.transaction}</td>
                        <td>${notification.time}</td>
                    `;
                    notificationBody.appendChild(row);
                });
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu thông báo:', error);
            }
        }
    });

    document.addEventListener('click', (event) => {
        if (!notificationIcon.contains(event.target) && !notificationPopup.contains(event.target)) {
            notificationPopup.style.display = 'none';
            isPopupVisible = false;
        }
    });
});