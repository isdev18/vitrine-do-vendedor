"""
Vitrine do Vendedor - API Serverless (Vercel)
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import hashlib
import jwt
from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlparse

# Configurações
SECRET_KEY = os.environ.get('SECRET_KEY', 'vitrine-vendedor-secret-2026')
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'jwt-vitrine-vendedor-secret-2026')

# "Banco de dados" em memória (para demo - em produção use Supabase/Postgres)
# Nota: Em serverless, os dados não persistem entre requests
# Para persistência real, conecte ao Supabase via API REST

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload['user_id']
    except:
        return None

def json_response(data, status=200):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps(data, ensure_ascii=False)
    }

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            'success': True,
            'message': '🏍️ Vitrine do Vendedor API está online!',
            'version': '1.0.0',
            'endpoints': [
                'GET /api - Status da API',
                'POST /api/auth/register - Cadastrar usuário',
                'POST /api/auth/login - Login',
                'GET /api/vitrine/:slug - Ver vitrine pública'
            ]
        }
        
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode())
    
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            'success': True,
            'message': 'API funcionando! Para persistência de dados, conecte ao Supabase.',
            'note': 'Serverless functions não mantêm estado entre requests.'
        }
        
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode())
