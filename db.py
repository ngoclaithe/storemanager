from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
db = SQLAlchemy()

class Register(db.Model):
    __tablename__ = 'register'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    usertype = db.Column(db.String(20), nullable=False)
    secret_question = db.Column(db.String(255), nullable=False)

class Product(db.Model):
    __tablename__ = 'product'
    
    id_product = db.Column(db.Integer, primary_key=True, autoincrement=True)
    plu = db.Column(db.String(50), nullable=False)
    barcode = db.Column(db.String(50), nullable=False)
    nameproduct = db.Column(db.String(255), nullable=True)
    groupproduct = db.Column(db.String(255), nullable=True)
    brand = db.Column(db.String(255), nullable=True)
    costcapital = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Integer, nullable=False)
    inventory = db.Column(db.Integer, nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    path_image = db.Column(db.String(255), nullable=True)

class Bill(db.Model):
    __tablename__ = 'bill'
    
    id_bill = db.Column(db.Integer, primary_key=True)
    quantity = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, default=lambda: datetime.utcnow().replace(microsecond=0), nullable=False)
    type_customer = db.Column(db.String(255), nullable=True)
    totalprice = db.Column(db.Integer, nullable=True)
    discount = db.Column(db.Integer, nullable=True)
    afterdiscount = db.Column(db.Integer, nullable=True)
    customerpaid = db.Column(db.Integer, nullable=True)
    id_product = db.Column(db.Integer, nullable=False)

class Treasury(db.Model):
    __tablename__ = 'treasury'
    
    id_treasury = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(255), nullable=False)
    type_treasury = db.Column(db.String(255), nullable=True)
    receiver = db.Column(db.String(255), nullable=True)
    submitter = db.Column(db.String(255), nullable=True)
    value = db.Column(db.Integer, nullable=True)
    note = db.Column(db.String(255), nullable=True)
    user_create = db.Column(db.String(255), nullable=False)

class Staff(db.Model):
    __tablename__ = 'staff'
    
    id_staff = db.Column(db.Integer, primary_key=True)
    type_staff = db.Column(db.String(255), nullable=True)
    name_staff = db.Column(db.String(255), nullable=True)
    date_birth = db.Column(db.String(255), nullable=True)
    home_town = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.Integer, nullable=True)
