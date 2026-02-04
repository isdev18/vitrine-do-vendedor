from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(30))
    role = db.Column(db.String(20), default='user')
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vitrines = db.relationship('Vitrine', backref='user', cascade='all, delete-orphan', lazy=True)


class Vitrine(db.Model):
    __tablename__ = 'vitrine'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    logo_url = db.Column(db.Text)
    banner_url = db.Column(db.Text)
    primary_color = db.Column(db.String(20))
    whatsapp = db.Column(db.String(30))
    instagram = db.Column(db.String(120))
    address = db.Column(db.String(255))
    city = db.Column(db.String(120))
    state = db.Column(db.String(2))
    is_active = db.Column(db.Boolean, default=True)
    views = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    produtos = db.relationship('Produto', backref='vitrine', cascade='all, delete-orphan', lazy=True)


class Produto(db.Model):
    __tablename__ = 'produto'
    id = db.Column(db.Integer, primary_key=True)
    vitrine_id = db.Column(db.Integer, db.ForeignKey('vitrine.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2))
    year = db.Column(db.Integer)
    km = db.Column(db.Integer)
    color = db.Column(db.String(50))
    image_url = db.Column(db.Text)
    images = db.Column(db.Text)
    is_featured = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    views = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
