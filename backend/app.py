import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client
import bcrypt

app = Flask(__name__)
CORS(app)

# Configuração Supabase
SUPABASE_URL = "https://eanxsqwulvkxfolayukz.supabase.co"
SUPABASE_KEY = "sb_publishable_IZX_v5IDjqEHEqrrNy38TA_M9pMtuW2"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Funções de segurança
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Rotas de usuário
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        nome = data.get('nome', '').strip()
        email = data.get('email', '').strip().lower()
        senha = data.get('senha', '')

        if not nome or not email or not senha:
            return jsonify({'success': False, 'message': 'Nome, email e senha são obrigatórios'}), 400

        # Verificar se email já existe
        existing = supabase.table('users').select('id').eq('email', email).execute()
        if existing.data:
            return jsonify({'success': False, 'message': 'Email já cadastrado'}), 400

        # Criptografar senha
        senha_hash = hash_password(senha)

        # Salvar no Supabase
        response = supabase.table('users').insert({
            'nome': nome,
            'email': email,
            'senha_hash': senha_hash
        }).execute()

        return jsonify({'success': True, 'message': 'Usuário cadastrado com sucesso'}), 201

    except Exception as e:
        return jsonify({'success': False, 'message': 'Erro interno do servidor'}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        senha = data.get('senha', '')

        if not email or not senha:
            return jsonify({'success': False, 'message': 'Email e senha são obrigatórios'}), 400

        # Buscar usuário no Supabase
        response = supabase.table('users').select('*').eq('email', email).execute()
        if not response.data:
            return jsonify({'success': False, 'message': 'Credenciais inválidas'}), 401

        user = response.data[0]
        if not check_password(senha, user['senha_hash']):
            return jsonify({'success': False, 'message': 'Credenciais inválidas'}), 401

        return jsonify({
            'success': True,
            'message': 'Login realizado com sucesso',
            'user': {'id': user['id'], 'nome': user['nome'], 'email': user['email']}
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': 'Erro interno do servidor'}), 500

# Rotas de motos
@app.route('/motos', methods=['POST'])
def create_moto():
    try:
        data = request.get_json()
        nome = data.get('nome', '').strip()
        marca = data.get('marca', '').strip()
        preco = data.get('preco')
        cilindrada = data.get('cilindrada')
        imagem_url = data.get('imagem_url', '').strip()

        if not nome or not marca or preco is None:
            return jsonify({'success': False, 'message': 'Nome, marca e preço são obrigatórios'}), 400

        # Salvar no Supabase
        response = supabase.table('motos').insert({
            'nome': nome,
            'marca': marca,
            'preco': preco,
            'cilindrada': cilindrada,
            'imagem_url': imagem_url
        }).execute()

        return jsonify({'success': True, 'message': 'Moto cadastrada com sucesso'}), 201

    except Exception as e:
        return jsonify({'success': False, 'message': 'Erro interno do servidor'}), 500

@app.route('/motos', methods=['GET'])
def get_motos():
    try:
        response = supabase.table('motos').select('*').execute()
        return jsonify({'success': True, 'motos': response.data}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': 'Erro interno do servidor'}), 500

# Rota inicial
@app.route('/')
def home():
    return jsonify({"message": "API ONLINE 🚀"})

# Tratamento de erro
@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Erro interno"}), 500

if __name__ == "__main__":
    app.run()
