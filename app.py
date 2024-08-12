import os
from flask import (
    Flask,
    url_for,
    redirect,
    render_template,
    request,
    session,
    jsonify,
    send_file,
)
from db import db, Register, Product, Bill, Treasury, Staff, Customer, Timekeeping
from datetime import datetime, timedelta, date
import hashlib
import csv
from flask import send_file
from io import StringIO
import math
from PIL import Image, ImageDraw
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from werkzeug.utils import secure_filename
from sqlalchemy.exc import ProgrammingError
from flask_migrate import Migrate
from sqlalchemy import func, extract


app = Flask(__name__)
app.secret_key = os.urandom(24)
UPLOAD_FOLDER = "static\images"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
# Configure SQLite database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///quanlypbanhang.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
db.init_app(app)
with app.app_context():
    db.create_all()

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def md5_hash(text):
    return hashlib.md5(text.encode()).hexdigest()


@app.route("/")
def home():
    return render_template("login.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = md5_hash(request.form["password"])
        user = Register.query.filter_by(email=email, password=password).first()

        if user:
            session["user_id"] = user.id
            session["usertype"] = user.usertype
            if user.usertype == "admin":
                return redirect(url_for("admin_overview"))
            elif user.usertype in ["nhanvienkho", "nhanvienbanhang", "nhanvienthuquy"]:
                return redirect(url_for("staff_timekeeping"))
        else:
            return "Notok", 400
    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        user = request.form["user"]
        email = request.form["email"]
        secret_question = request.form["secretquestion"]
        password = md5_hash(request.form["password"])
        usertype = "admin"
        if len(password) < 8:
            return (
                jsonify({"error": "Password must be at least 8 characters long"}),
                400,
            )

        existing_user = Register.query.filter_by(email=email).first()
        if existing_user:
            return "Email đã được đăng ký"

        new_user = Register(
            user=user,
            email=email,
            password=password,
            usertype=usertype,
            secret_question=secret_question,
        )
        db.session.add(new_user)
        db.session.commit()

        return redirect(url_for("login"))
    return render_template("register.html")


@app.route("/login_page")
def login_page():
    return render_template("login.html")


@app.route("/register_page")
def register_page():
    return render_template("register.html")


@app.route("/forgot_password", methods=["POST", "GET"])
def forgot_password():
    if request.method == "POST":
        username = request.form.get("user")
        email = request.form.get("email")
        secret_question = request.form.get("secretquestion")
        user = Register.query.filter_by(
            user=username, email=email, secret_question=secret_question
        ).first()

        if user:
            return jsonify({"success": True}), 200
        else:
            return (
                jsonify({"error": "Username, email, and secret question do not match"}),
                400,
            )

    return render_template("forgot_password.html")


@app.route("/reset_password", methods=["POST"])
def reset_password():
    email = request.form.get("email")
    new_password = request.form.get("newPassword")

    if not email or not new_password:
        return jsonify({"error": "Missing email or new password"}), 400
    hashed_password = md5_hash(new_password)
    user = Register.query.filter_by(email=email).first()
    if user:
        user.password = hashed_password
        db.session.commit()
        return jsonify({"message": "Password reset successfully"}), 200
    return jsonify({"error": "Email not found"}), 400


@app.route("/change_password", methods=["POST"])
def change_password():
    if "user_id" in session:
        user_id = session["user_id"]
        old_password = md5_hash(request.form["old_password"])
        new_password = md5_hash(request.form["new_password"])

        user = Register.query.filter_by(id=user_id, password=old_password).first()
        if user:
            user.password = new_password
            db.session.commit()
            return "OK", 200
        else:
            return jsonify({"error": "Mật khẩu cũ không đúng"}), 400
    else:
        return jsonify({"error": "Không tìm thấy người dùng"}), 401


@app.route("/update_username", methods=["POST"])
def update_username():
    if "user_id" in session:
        user_id = session["user_id"]
        new_username = request.form["new_username"]

        user = Register.query.filter_by(id=user_id).first()
        if user:
            user.user = new_username
            db.session.commit()
            return "OK", 200
        else:
            return (
                jsonify(
                    {
                        "error": "Không tìm thấy người dùng hoặc tên người dùng không thay đổi"
                    }
                ),
                400,
            )
    else:
        return jsonify({"error": "Không tìm thấy người dùng"}), 401


@app.route("/staff", methods=["GET"])
def amdin_staff():
    if "user_id" in session and session["usertype"] == "admin":
        user = Register.query.filter_by(id=session["user_id"]).first()
        if user:
            return render_template("admin/staff.html", user_name=user.user)
        else:
            return "Không tìm thấy thông tin người dùng"
    else:
        return redirect(url_for("login"))


@app.route("/logout", methods=["GET"])
def logout():
    session.clear()
    return "OK", 200


def send_email(
    email,
    password,
    recipient,
    subject,
    content,
    cc_recipients=None,
    bcc_recipients=None,
):
    server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
    server.ehlo()
    server.login(email, password)

    msg = MIMEMultipart()
    msg["From"] = email
    msg["To"] = recipient
    msg["Subject"] = subject

    msg.attach(MIMEText(content, "html"))

    if cc_recipients:
        msg["Cc"] = ", ".join(cc_recipients)

    if bcc_recipients:
        msg["Bcc"] = ", ".join(bcc_recipients)

    try:
        server.sendmail(
            email,
            [recipient] + (cc_recipients or []) + (bcc_recipients or []),
            msg.as_string(),
        )
        print("Email sent successfully!")
    except Exception as e:
        print(f"Error sending email: {e}")
    finally:
        server.quit()


@app.route("/overview", methods=["GET"])
def admin_overview():
    if "user_id" in session and session["usertype"] == "admin":
        user = Register.query.filter_by(id=session["user_id"]).first()
        if user:
            return render_template("admin/overview.html", user_name=user.user)
        else:
            return "Không tìm thấy thông tin người dùng"
    else:
        return redirect(url_for("login"))


@app.route("/staff_timekeeping", methods=["GET"])
def staff_timekeeping():
    if "user_id" in session and session["usertype"] in [
        "nhanvienkho",
        "nhanvienbanhang",
        "nhanvienthuquy",
    ]:
        user = Register.query.filter_by(id=session["user_id"]).first()
        if user:
            staff = Staff.query.filter_by(phone=user.phone).first()
            if staff:
                return render_template(
                    "staff_timekeeping.html",
                    user_id=staff.id_staff,
                    user_name=user.user,
                )
            else:
                return "Không tìm thấy thông tin nhân viên"
        else:
            return "Không tìm thấy thông tin người dùng"
    else:
        return redirect(url_for("login"))


def get_products():
    products = Product.query.with_entities(
        Product.id_product,
        Product.plu,
        Product.barcode,
        Product.nameproduct,
        Product.groupproduct,
        Product.brand,
        Product.costcapital,
        Product.price,
        Product.inventory,
        Product.unit,
        Product.path_image,
        Product.size,
        Product.color
    ).all()

    product_list = []
    for product in products:
        product_data = {
            "id_product": product.id_product,
            "plu": product.plu,
            "barcode": product.barcode,
            "nameproduct": product.nameproduct,
            "groupproduct": product.groupproduct,
            "brand": product.brand,
            "costcapital": product.costcapital,
            "price": product.price,
            "inventory": product.inventory,
            "unit": product.unit,
            "path_image": (
                url_for("static", filename="images/" + product.path_image)
                if product.path_image
                else None
            ), 
            "color": product.color,
            "size": product.size
        }
        product_list.append(product_data)

    return product_list


@app.route("/product", methods=["GET"])
def admin_product():
    if "user_id" in session and session["usertype"] == "admin":
        user = Register.query.filter_by(id=session["user_id"]).first()

        if user:
            products = get_products()
            return render_template(
                "admin/product.html", user_name=user.user, products=products
            )
        else:
            return "Không tìm thấy thông tin người dùng"
    else:
        return redirect(url_for("login"))


def get_bills():
    try:
        bills = Bill.query.with_entities(
            Bill.id_bill,
            Bill.date,
            Bill.type_customer,
            Bill.totalprice,
            Bill.discount,
            Bill.afterdiscount,
            Bill.customerpaid,
            Bill.id_product,
        ).all()
    except ProgrammingError:
        bills = []

    bill_list = []
    for bill in bills:
        bill_data = {
            "id_bill": bill.id_bill,
            "code_bill": "HD{:04d}".format(bill.id_bill),
            "date": bill.date,
            "type_customer": bill.type_customer,
            "totalprice": bill.totalprice,
            "discount": bill.discount,
            "afterdiscount": bill.afterdiscount,
            "customerpaid": bill.customerpaid,
            "id_product": bill.id_product,
        }
        bill_list.append(bill_data)

    return bill_list


@app.route("/transaction", methods=["GET"])
def admin_transaction():
    if "user_id" in session and session["usertype"] == "admin":
        user = Register.query.filter_by(id=session["user_id"]).first()
        if user:
            bills = get_bills()
            return render_template(
                "admin/transaction.html", user_name=user.user, bills=bills
            )
        else:
            return "Không tìm thấy thông tin người dùng"
    else:
        return redirect(url_for("login"))

@app.route("/add_bill_import", methods=["POST"])
def add_bill_import():
    if request.method == "POST":
        data = request.json
        items = data.get("items")
        supplier = data.get("supplier")

        new_
        pass
@app.route("/add_bill", methods=["POST"])
def add_bill():
    if request.method == "POST":
        data = request.json
        items = data.get("items")
        if not items:
            return "Missing items", 400

        id_product = items[0].get("productId")
        type_customer = items[0].get("typeCustomer")
        quantity = items[0].get("quantity")
        totalprice = data.get("totalprice")
        discount = data.get("discount")
        afterdiscount = data.get("afterdiscount")
        customerpaid = data.get("customerpaid")
        name_customer = data.get("name_customer")
        phone_customer = data.get("phone_customer")

        product = Product.query.filter_by(id_product=id_product).first()
        if product is None:
            return "Product not found", 404

        if quantity > product.inventory:
            return "Failed to add bill: Quantity exceeds available inventory", 400

        product.inventory -= quantity
        db.session.add(product)

        customer = Customer.query.filter_by(phone_customer=phone_customer).first()

        if customer is None:
            new_customer = Customer(
                name_customer=name_customer,
                phone_customer=phone_customer,
                type_customer=type_customer,
            )
            db.session.add(new_customer)

        new_bill = Bill(
            id_product=id_product,
            quantity=quantity,
            type_customer=type_customer,
            totalprice=totalprice,
            discount=discount,
            afterdiscount=afterdiscount,
            customerpaid=customerpaid,
            phone_customer=phone_customer,
        )

        db.session.add(new_bill)
        db.session.commit()

        return "Bill added successfully", 200


@app.route("/delete_bill", methods=["DELETE"])
def delete_bill():
    data = request.json
    id_bill = data.get("id_bill")

    if not id_bill:
        return jsonify({"success": False, "message": "Missing id_bill"}), 400

    bill = Bill.query.filter_by(id_bill=id_bill).first()

    if not bill:
        return jsonify({"success": False, "message": "Bill not found"}), 404

    db.session.delete(bill)
    db.session.commit()

    return jsonify({"success": True, "message": "Bill deleted successfully"}), 200


def get_treasurys():
    try:
        treasurys = Treasury.query.with_entities(
            Treasury.id_treasury,
            Treasury.date,
            Treasury.type_treasury,
            Treasury.receiver,
            Treasury.submitter,
            Treasury.value,
            Treasury.note,
            Treasury.user_create,
        ).all()
    except ProgrammingError:
        treasurys = []

    treasury_list = []
    for treasury in treasurys:
        treasury_data = {
            "id_treasury": treasury.id_treasury,
            "code_treasury": "TC{:04d}".format(treasury.id_treasury),
            "date": treasury.date,
            "type_treasury": treasury.type_treasury,
            "receiver": treasury.receiver,
            "submitter": treasury.submitter,
            "value": treasury.value,
            "note": treasury.note,
            "user_create": treasury.user_create,
        }
        treasury_list.append(treasury_data)

    return treasury_list


def cacul_treasury():
    opening_balance = 100000000
    current_month = datetime.now().month
    current_year = datetime.now().year

    try:
        treasurys = Treasury.query.filter(
            extract("month", Treasury.date) == current_month,
            extract("year", Treasury.date) == current_year,
        ).all()
    except ProgrammingError:
        return opening_balance, 0, 0, opening_balance

    total_income = sum(t.value for t in treasurys if t.type_treasury == "Thu tiền")
    total_expense = sum(t.value for t in treasurys if t.type_treasury == "Chi tiền")
    closing_balance = opening_balance + total_income - total_expense

    return opening_balance, total_income, total_expense, closing_balance


@app.route("/treasury", methods=["GET"])
def admin_treasury():
    if "user_id" in session and session["usertype"] == "admin":
        user = Register.query.filter_by(id=session["user_id"]).first()
        if user:
            treasurys = get_treasurys()
            opening_balance, total_income, total_expense, closing_balance = (
                cacul_treasury()
            )
            return render_template(
                "admin/treasury.html",
                user_name=user.user,
                treasurys=treasurys,
                opening_balance=opening_balance,
                total_income=total_income,
                total_expense=total_expense,
                closing_balance=closing_balance,
            )
        else:
            return "Không tìm thấy thông tin người dùng"
    else:
        return redirect(url_for("login"))


@app.route("/account", methods=["GET"])
def admin_account():
    if "user_id" in session and session["usertype"] == "admin":
        user = Register.query.filter_by(id=session["user_id"]).first()
        if user:
            return render_template("admin/account.html", user_name=user.user)
        else:
            return "Không tìm thấy thông tin người dùng"
    else:
        return redirect(url_for("login"))


@app.route("/report", methods=["GET"])
def admin_report():
    if "user_id" in session and session["usertype"] == "admin":
        user = Register.query.filter_by(id=session["user_id"]).first()
        if user:
            return render_template("admin/report.html", user_name=user.user)
        else:
            return "Không tìm thấy thông tin người dùng"
    else:
        return redirect(url_for("login"))


@app.route("/add_bill_import_page")
def add_bill_import_page():
    if "user_id" in session and session["usertype"] == "admin":
        user = Register.query.filter_by(id=session["user_id"]).first()
        if user:
            return render_template("admin/add_bill_import.html", user_name=user.user)
        else:
            return "Không tìm thấy thông tin người dùng"
    else:
        return redirect(url_for("login"))
@app.route("/add_bill_export_page")
def add_bill_export_page():
    if "user_id" in session and session["usertype"] == "admin":
        user = Register.query.filter_by(id=session["user_id"]).first()
        if user:
            return render_template("admin/add_bill_export.html", user_name=user.user)
        else:
            return "Không tìm thấy thông tin người dùng"
    else:
        return redirect(url_for("login"))

@app.route("/add_product", methods=["POST"])
def add_product():
    if request.method == "POST":
        plu = request.form["plu"]
        barcode = request.form["barcode"]
        nameproduct = request.form["nameproduct"]
        groupproduct = request.form["groupproduct"]
        brand = request.form["brand"]
        costcapital = request.form["costcapital"]
        price = request.form["price"]
        inventory = request.form["inventory"]
        unit = request.form["unit"]
        color = request.form["color"]
        size = request.form["size"]

        if "path_image" in request.files:
            file = request.files["path_image"]
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
                path_image = filename
            else:
                path_image = ""
        else:
            path_image = ""

        new_product = Product(
            plu=plu,
            barcode=barcode,
            nameproduct=nameproduct,
            groupproduct=groupproduct,
            brand=brand,
            costcapital=costcapital,
            price=price,
            inventory=inventory,
            unit=unit,
            path_image=path_image,
            color = color,
            size = size
        )

        db.session.add(new_product)
        db.session.commit()

        return "Product added successfully", 200
@app.route("/update_product/<int:idProduct>", methods=["POST"])
def update_product(idProduct):
    if request.method == "POST":
        data = request.form
        files = request.files

        product = Product.query.get(idProduct)
        print(data)
        if product:
            product.plu = data.get("plu", product.plu)
            product.barcode = data.get("barcode", product.barcode)
            product.nameproduct = data.get("nameproduct", product.nameproduct)
            product.groupproduct = data.get("groupproduct", product.groupproduct)
            product.brand = data.get("brand", product.brand)
            product.costcapital = data.get("costcapital", product.costcapital)
            product.price = data.get("price", product.price)
            product.inventory = data.get("inventory", product.inventory)
            product.unit = data.get("unit", product.unit)
            product.size = data.get("size", product.unit)
            product.color = data.get("color", product.unit)

            if "path_image" in files and files["path_image"].filename:
                file = files["path_image"]
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
                    product.path_image = filename

            db.session.commit()

            return jsonify({"message": "Cập nhật thành công"}), 200
        else:
            return jsonify({"message": "Không tìm thấy sản phẩm"}), 404

@app.route("/delete_product/<int:idProduct>", methods=["POST"])
def delete_product(idProduct):
    if request.method == "POST":
        product = Product.query.get(idProduct)
        
        if product:
            db.session.delete(product)
            db.session.commit()
            return jsonify({"message": "Xóa thành công"}), 200
        else:
            return jsonify({"message": "Không tìm thấy sản phẩm"}), 404

@app.route("/search_product")
def search_product():
    query = request.args.get("q")
    products = Product.query.filter(Product.plu.like(f"%{query}%")).all()
    product_list = [
        {"id": p.id_product, "plu": p.plu,"name": p.nameproduct, "price": p.price, "inventory": p.inventory, "size": p.size, "color": p.color, "unit": p.unit}
        for p in products
    ]
    return jsonify(product_list)
@app.route("/search_customer")
def search_customer():
    query = request.args.get("q")
    customers = Customer.query.filter(Customer.phone_customer.like(f"%{query}%")).all()
    customer_list = [
        {"name_customer": c.name_customer, "phone_customer": c.phone_customer}
        for c in customers
    ]
    return jsonify(customer_list)

@app.route("/sales_today")
def sales_today():
    today = date.today()
    yesterday = today - timedelta(days=1)

    sales_today = (
        db.session.query(func.sum(Bill.quantity))
        .filter(func.date(Bill.date) == today)
        .scalar()
    )
    revenue_today = (
        db.session.query(func.sum(Bill.totalprice))
        .filter(func.date(Bill.date) == today)
        .scalar()
    )

    sold_product = (
        db.session.query(func.count(func.distinct(Bill.id_product)))
        .filter(func.date(Bill.date) == today)
        .scalar()
    )

    revenue_yesterday = (
        db.session.query(func.sum(Bill.totalprice))
        .filter(func.date(Bill.date) == yesterday)
        .scalar()
    )

    sales_today = sales_today if sales_today else 0
    revenue_today = revenue_today if revenue_today else 0
    sold_product = sold_product if sold_product else 0
    revenue_yesterday = revenue_yesterday if revenue_yesterday else 0

    sales_over_time = {"times": [], "quantities": []}
    sales_data = (
        db.session.query(
            func.strftime("%H:%M", Bill.date).label("hour"),
            func.sum(Bill.quantity).label("quantity"),
        )
        .filter(func.date(Bill.date) == today)
        .group_by("hour")
        .all()
    )

    for record in sales_data:
        sales_over_time["times"].append(record.hour)
        sales_over_time["quantities"].append(record.quantity)

    return jsonify(
        {
            "sold_today": sales_today,
            "revenue_today": revenue_today,
            "sold_product": sold_product,
            "revenue_yesterday": revenue_yesterday,
            "sales_over_time": sales_over_time,
        }
    )


@app.route("/add_treasury", methods=["POST"])
def add_treasury():
    user_create = Register.query.filter_by(id=session["user_id"]).first()
    if request.method == "POST":
        data = request.json
        print(data)
        date = data.get("datetime")
        type_treasury = data.get("type_treasury")
        receiver = data.get("receiver")
        submitter = data.get("submitter")
        value = data.get("value")
        note = data.get("notes")

        new_treasury = Treasury(
            date=date,
            type_treasury=type_treasury,
            receiver=receiver,
            submitter=submitter,
            value=value,
            note=note,
            user_create=user_create.user,
        )
        db.session.add(new_treasury)
        db.session.commit()

        return "Phiếu thu chi đã được thêm thành công", 200
    return "Phương thức không hợp lệ", 400


@app.route("/exportfiletreasury", methods=["GET"])
def export_file_treasury():
    try:
        treasurys = get_treasurys()
        treasury_rows = [
            [
                treasury["id_treasury"],
                treasury["date"],
                treasury["user_create"],
                treasury["type_treasury"],
                treasury["receiver"],
                treasury["submitter"],
                treasury["value"],
                treasury["note"],
            ]
            for treasury in treasurys
        ]
        header = [
            "Mã phiếu",
            "Thời gian",
            "Người tạo",
            "Loại thu chi",
            "Người nhận",
            "Người nộp",
            "Giá trị",
            "Ghi chú",
        ]
        with open("Baocaosoquy.csv", "w", newline="", encoding="utf-8-sig") as f:
            csv_writer = csv.writer(f)
            csv_writer.writerow(header)
            csv_writer.writerows(treasury_rows)

        return (
            send_file("Baocaosoquy.csv", as_attachment=True, mimetype="text/csv"),
            200,
        )

    except Exception as e:
        print("Exception occurred:", str(e))
        return jsonify({"message": str(e)}), 500


@app.route("/export_product", methods=["GET"])
def export_product():
    try:
        products = get_products()
        product_rows = [
            [
                product["id_product"],
                product["nameproduct"],
                product["costcapital"],
                product["price"],
                product["inventory"],
            ]
            for product in products
        ]

        header = ["Mã hàng", "Tên hàng", "Giá vốn", "Giá bán", "Tồn kho"]

        with open("Baocaohanghoa.csv", "w", newline="", encoding="utf-8-sig") as f:
            csv_writer = csv.writer(f)
            csv_writer.writerow(header)
            csv_writer.writerows(product_rows)

        return (
            send_file("Baocaohanghoa.csv", as_attachment=True, mimetype="text/csv"),
            200,
        )

    except Exception as e:
        print("Exception occurred:", str(e))
        return jsonify({"message": str(e)}), 500


def get_staffs():
    try:
        staffs = Staff.query.with_entities(
            Staff.id_staff,
            Staff.type_staff,
            Staff.name_staff,
            Staff.date_birth,
            Staff.home_town,
            Staff.phone,
        ).all()
    except ProgrammingError:
        staffs = []

    staff_list = []
    for staff in staffs:
        staff_data = {
            "id_staff": staff.id_staff,
            "type_staff": staff.type_staff,
            "name_staff": staff.name_staff,
            "date_birth": staff.date_birth,
            "home_town": staff.home_town,
            "phone": staff.phone,
        }
        staff_list.append(staff_data)

    return staff_list


@app.route("/list_staff", methods=["GET"])
def list_staff():
    try:
        staff_list = get_staffs()
        return jsonify(staff_list), 200
    except Exception as e:
        print("Exception occurred:", str(e))
        return jsonify({"message": str(e)}), 500


@app.route("/add_staff", methods=["POST"])
def add_staff():
    if request.method == "POST":
        data = request.json
        try:
            new_staff = Staff(
                name_staff=data.get("name_staff"),
                date_birth=data.get("date_birth"),
                home_town=data.get("home_town"),
                type_staff=data.get("type_staff"),
                phone=data.get("phone"),
            )
            new_user = Register(
                user=data.get("name_staff"),
                email=data.get("staff_email"),
                password=md5_hash(data.get("staff_password")),
                usertype=data.get("type_staff"),
                secret_question=data.get("secret_question"),
                phone=data.get("phone"),
            )
            db.session.add(new_user)
            db.session.commit()
            db.session.add(new_staff)
            db.session.commit()

            return jsonify({"message": "Staff added successfully"}), 200
        except Exception as e:
            print("Exception occurred:", str(e))
            db.session.rollback()
            return jsonify({"message": str(e)}), 500


@app.route("/report_product", methods=["POST"])
def report_product():
    if request.method == "POST":
        today = datetime.utcnow().date()
        reports = (
            db.session.query(
                Product.id_product,
                Product.nameproduct,
                db.func.sum(Bill.quantity).label("quantity_sold"),
                Product.costcapital,
                Product.price,
                db.func.sum(Bill.quantity * Product.price).label("revenue"),
            )
            .join(Bill, Product.id_product == Bill.id_product)
            .filter(db.func.date(Bill.date) == today)
            .group_by(
                Product.id_product,
                Product.nameproduct,
                Product.costcapital,
                Product.price,
            )
            .all()
        )

        report_list = []
        for report in reports:
            report_data = {
                "id_product": report.id_product,
                "nameproduct": report.nameproduct,
                "quantity_sold": report.quantity_sold,
                "costcapital": report.costcapital,
                "price": report.price,
                "revenue": report.revenue,
            }
            report_list.append(report_data)

        return jsonify(report_list)


@app.route("/report_customer", methods=["POST"])
def report_customer():
    if request.method == "POST":
        today = datetime.utcnow().date()

        reports = (
            db.session.query(
                Customer.name_customer,
                Customer.phone_customer,
                Customer.type_customer,
                func.count(Bill.id_product).label("items_purchased"),
                func.sum(Bill.customerpaid).label("total_paid"),
            )
            .join(Bill, Customer.phone_customer == Bill.phone_customer)
            .filter(func.date(Bill.date) == today)
            .group_by(
                Customer.name_customer, Customer.phone_customer, Customer.type_customer
            )
            .all()
        )

        report_list = []
        for report in reports:
            report_data = {
                "name_customer": report.name_customer,
                "phone_customer": report.phone_customer,
                "type_customer": report.type_customer,
                "items_purchased": report.items_purchased,
                "total_paid": report.total_paid,
            }
            report_list.append(report_data)

        return jsonify(report_list)


@app.route("/search_staff", methods=["GET"])
def search_staff():
    staff_list = Staff.query.with_entities(Staff.id_staff, Staff.name_staff).all()
    staff_data = [
        {"id_staff": s.id_staff, "name_staff": s.name_staff} for s in staff_list
    ]
    return jsonify(staff_data)


@app.route("/get_timekeeping/<int:staff_id>", methods=["GET"])
def get_timekeeping(staff_id):
    records = Timekeeping.query.filter_by(id_staff=staff_id).all()
    timekeeping_data = [
        {
            "day": record.day.strftime("%Y-%m-%d"),
            "checkin": record.checkin.strftime("%H:%M:%S") if record.checkin else None,
            "checkout": (
                record.checkout.strftime("%H:%M:%S") if record.checkout else None
            ),
        }
        for record in records
    ]
    print(timekeeping_data)
    return jsonify(timekeeping_data)


@app.route("/checkin/<int:staff_id>", methods=["POST"])
def checkin(staff_id):
    now = datetime.now()
    today = now.date()
    checkin_time = now.time()

    timekeeping_record = Timekeeping.query.filter_by(
        id_staff=staff_id, day=today
    ).first()

    if timekeeping_record:
        return jsonify({"message": "Đã có bản ghi chấm công cho ngày hôm nay"}), 400

    new_record = Timekeeping(id_staff=staff_id, day=today, checkin=checkin_time)
    db.session.add(new_record)
    db.session.commit()

    return jsonify({"message": "Check-in thành công"}), 200


@app.route("/checkout/<int:staff_id>", methods=["POST"])
def checkout(staff_id):
    now = datetime.now()
    today = now.date()
    checkout_time = now.time()

    timekeeping_record = Timekeeping.query.filter_by(
        id_staff=staff_id, day=today
    ).first()

    if not timekeeping_record:
        return (
            jsonify({"message": "Không tìm thấy bản ghi chấm công để check-out"}),
            400,
        )

    if timekeeping_record.checkout:
        return jsonify({"message": "Đã có giờ check-out cho ngày hôm nay"}), 400

    timekeeping_record.checkout = checkout_time
    db.session.commit()

    return jsonify({"message": "Check-out thành công"}), 200
@app.route('/salary_staff_calcu', methods=['GET'])
def salary_staff_calcu():
    dayfrom = request.args.get('dayfrom')
    dayto = request.args.get('dayto')

    dayfrom_date = datetime.strptime(dayfrom, '%Y-%m-%d').date()
    dayto_date = datetime.strptime(dayto, '%Y-%m-%d').date()

    timekeeping_records = Timekeeping.query.filter(Timekeeping.day >= dayfrom_date,
                                                   Timekeeping.day <= dayto_date).all()

    all_staff = Staff.query.all()

    results = []

    for staff in all_staff:
        staff_result = {"name_staff": staff.name_staff}
        total_shifts = 0
        current_date = dayfrom_date
        
        while current_date <= dayto_date:
            record = next((r for r in timekeeping_records if r.day == current_date and r.id_staff == staff.id_staff), None)
            
            if record and record.checkin and record.checkout:
                checkin_time = datetime.combine(record.day, record.checkin)
                checkout_time = datetime.combine(record.day, record.checkout)
                duration = checkout_time - checkin_time
                hours_worked = duration.total_seconds() / 3600.0

                if hours_worked < 3.5:
                    shifts = 0
                elif 3.5 <= hours_worked < 7.5:
                    shifts = 1
                elif 7.5 <= hours_worked < 11.5:
                    shifts = 2
                elif 11.5 <= hours_worked < 15.5:
                    shifts = 3
                else:
                    shifts = 4
            else:
                shifts = 0

            staff_result[current_date.strftime('%Y-%m-%d')] = shifts
            total_shifts += shifts
            current_date += timedelta(days=1)
        
        staff_result["total_shifts"] = total_shifts
        results.append(staff_result)
    
    print(results)
    return jsonify(results)


application = app


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
