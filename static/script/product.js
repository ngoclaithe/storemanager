function updateProduct(idProduct) {
    const row = document.querySelector(`tr[data-id="${idProduct}"]`);
    document.getElementById('update_id_product').value = idProduct;
    document.getElementById('update_plu').value = row.children[0].innerText;
    document.getElementById('update_barcode').value = row.children[1].innerText;
    document.getElementById('update_nameproduct').value = row.children[2].innerText;
    document.getElementById('update_brand').value = row.children[3].innerText;
    document.getElementById('update_color').value = row.children[4].innerText;
    document.getElementById('update_size').value = row.children[5].innerText;
    document.getElementById('update_costcapital').value = row.children[6].innerText;
    document.getElementById('update_price').value = row.children[7].innerText;
    document.getElementById('update_inventory').value = row.children[8].innerText;
    document.getElementById('update_unit').value = row.children[9].innerText;
    // document.getElementById('update_path_image').value = row.children[9].innerText;

    document.getElementById('updateModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}
document.getElementById('updateProductForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const idProduct = document.getElementById('update_id_product').value;
    const formData = new FormData(this); 

    fetch(`/update_product/${idProduct}`, {
        method: 'POST',
        body: formData 
    })
    .then(response => {
        if (response.ok) {
            alert("Sửa hàng thành công!");
            location.reload();
        } else {
            throw new Error('Xảy ra lỗi khi cập nhật đăng ký.');
        }
    })
    .catch(error => console.error('Lỗi:', error));
});


function deleteProduct(idProduct) {
    if (confirm("Bạn có chắc chắn muốn xóa mặt hàng này không?")) {
        fetch(`/delete_product/${idProduct}`, {
            method: 'POST'
        })
            .then(response => {
                if (response.ok) {
                    alert("Xóa thành công!");
                    location.reload();
                } else {
                    throw new Error('Xảy ra lỗi khi xóa sản phẩm.');
                }
            })
            .catch(error => console.error('Lỗi:', error));
    }
}

var addRegisterBtn = document.getElementById("addRegisterBtn");
addRegisterBtn.onclick = function () {
    document.getElementById('addProduct').style.display = "block";
}

var addProductForm = document.getElementById('addProductForm');
addProductForm.addEventListener('submit', function (event) {
    event.preventDefault();

    var formData = new FormData(addProductForm);

    fetch('/add_product', {
        method: 'POST',
        body: formData
    }).then(response => {
        if (response.status === 200) {
            alert("Sản phẩm đã được thêm thành công");
        } else {
            console.error('Failed to add product');
        }
    }).catch(error => {
        console.error('Error:', error);
    });
});

document.getElementById("exportExcelBtn").addEventListener("click", function () {
    fetch('/export_product', {
        method: 'GET'
    })
        .then(response => {
            if (response.ok) {
                return response.blob(); 
            } else {
                throw new Error("Xuất CSV không thành công.");
            }
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Baocaohanghoa.csv';
            document.body.appendChild(a);
            a.click();
            a.remove(); 
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi xuất file CSV.');
        });
});

document.getElementById("filterWaitAdminBtn").addEventListener("click", function () {
    var rows = document.querySelectorAll("tbody tr");
    console.log("Ấn button nè");
    rows.forEach(row => {
        var noteCell = row.querySelector("td:nth-child(14)");
        if (noteCell) {
            if (noteCell.innerText.trim() !== "wait admin") {
                row.style.display = "none";
            } else {
                row.style.display = "";
            }
        }
    });
});