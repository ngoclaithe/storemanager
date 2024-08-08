function updateRealtimeData() {
    var currentDate = new Date();
    var currentTime = currentDate.toLocaleTimeString();
    document.getElementById("realtime-data").innerHTML = "Tài khoản: " + userName + ", " + currentTime;
}

setInterval(updateRealtimeData, 1000);
