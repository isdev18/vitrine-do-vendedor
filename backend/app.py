"""
Backend API - Flask para Railway
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Configurações
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# CORS liberado
CORS(app)

# Banco
db = SQLAlchemy(app)

# Modelo User
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

# Criar banco
with app.app_context():
    db.create_all()

# JWT
JWT_SECRET = os.getenv('JWT_SECRET', 'jwt-secret')

def generate_token(user_id):
    payload = {'user_id': user_id, 'exp': datetime.utcnow() + timedelta(hours=1)}
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])['user_id']
    except:
        return None

# Rota / para teste
@app.route('/')
def home():
    return jsonify({'message': 'Backend funcionando!', 'status': 'ok'})

# Rota de cadastro
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username e password obrigatórios'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username já existe'}), 400
    user = User(username=username, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Usuário cadastrado'}), 201

# Rota de login
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Credenciais inválidas'}), 401
    token = generate_token(user.id)
    return jsonify({'token': token, 'message': 'Login realizado'}), 200

# Porta dinâmica
if __name__ == '__main__':
    PORT = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=PORT)
