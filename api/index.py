"""
Vitrine do Vendedor - API com Supabase REST
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import hashlib
import urllib.request
import urllib.error

# Configurações Supabase
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')

def supabase_request(endpoint, method='GET', data=None):
    """Fazer request para Supabase REST API"""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    req_data = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return {'error': e.read().decode()}
    except Exception as e:
        return {'error': str(e)}

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

class handler(BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        
        path = self.path
        
        # Status da API
        if path == '/api' or path == '/api/':
            response = {
                'success': True,
                'message': '🏍️ Vitrine do Vendedor API está online!',
                'version': '1.0.0',
                'database': 'Supabase conectado' if SUPABASE_URL else 'Não configurado'
            }
        
        # Listar vitrines públicas
        elif path.startswith('/api/vitrines'):
            vitrines = supabase_request('vitrines?is_active=eq.true&select=*')
            response = {'success': True, 'vitrines': vitrines if isinstance(vitrines, list) else []}
        
        # Vitrine por slug
        elif '/api/vitrine/' in path:
            slug = path.split('/api/vitrine/')[-1].split('?')[0]
            vitrine = supabase_request(f'vitrines?slug=eq.{slug}&select=*,produtos(*)')
            if vitrine and isinstance(vitrine, list) and len(vitrine) > 0:
                response = {'success': True, 'vitrine': vitrine[0]}
            else:
                response = {'success': False, 'message': 'Vitrine não encontrada'}
        
        # Produtos de uma vitrine
        elif '/api/produtos' in path:
            vitrine_id = path.split('vitrine_id=')[-1] if 'vitrine_id=' in path else None
            if vitrine_id:
                produtos = supabase_request(f'produtos?vitrine_id=eq.{vitrine_id}&select=*')
                response = {'success': True, 'produtos': produtos if isinstance(produtos, list) else []}
            else:
                response = {'success': False, 'message': 'vitrine_id necessário'}
        
        # Usuário por ID
        elif '/api/user/' in path:
            user_id = path.split('/api/user/')[-1].split('?')[0]
            users = supabase_request(f'users?id=eq.{user_id}&select=id,name,email,phone')
            if users and isinstance(users, list) and len(users) > 0:
                response = {'success': True, 'user': users[0]}
            else:
                response = {'success': False, 'message': 'Usuário não encontrado'}
        
        else:
            response = {'success': False, 'message': 'Endpoint não encontrado'}
        
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode())
    
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode() if content_length > 0 else '{}'
        
        try:
            data = json.loads(body)
        except:
            data = {}
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        
        path = self.path
        
        # Cadastro
        if path == '/api/auth/register':
            # Verificar se email já existe
            existing = supabase_request(f"users?email=eq.{data.get('email')}&select=id")
            if existing and isinstance(existing, list) and len(existing) > 0:
                response = {'success': False, 'message': 'Email já cadastrado'}
            else:
                user_data = {
                    'name': data.get('name'),
                    'email': data.get('email'),
                    'password_hash': hash_password(data.get('password', '')),
                    'phone': data.get('phone', ''),
                    'role': 'user',
                    'status': 'active'
                }
                result = supabase_request('users', 'POST', user_data)
                if 'error' in result:
                    response = {'success': False, 'message': str(result['error'])}
                else:
                    user = result[0] if isinstance(result, list) else result
                    response = {
                        'success': True,
                        'message': 'Usuário cadastrado com sucesso!',
                        'user': {'id': user.get('id'), 'name': user.get('name'), 'email': user.get('email')}
                    }
        
        # Login
        elif path == '/api/auth/login':
            email = data.get('email')
            password_hash = hash_password(data.get('password', ''))
            users = supabase_request(f'users?email=eq.{email}&password_hash=eq.{password_hash}&select=*')
            
            if users and isinstance(users, list) and len(users) > 0:
                user = users[0]
                response = {
                    'success': True,
                    'message': 'Login realizado com sucesso!',
                    'user': {
                        'id': user['id'],
                        'name': user['name'],
                        'email': user['email'],
                        'phone': user.get('phone', '')
                    }
                }
            else:
                response = {'success': False, 'message': 'Email ou senha incorretos'}
        
        # Criar/Atualizar vitrine
        elif path == '/api/vitrines':
            vitrine_data = {
                'user_id': data.get('user_id'),
                'name': data.get('name'),
                'slug': data.get('slug'),
                'description': data.get('description', ''),
                'whatsapp': data.get('whatsapp', ''),
                'instagram': data.get('instagram', ''),
                'address': data.get('address', ''),
                'city': data.get('city', ''),
                'state': data.get('state', ''),
                'is_active': data.get('is_active', True)
            }
            
            # Verificar se já existe vitrine para este usuário
            existing = supabase_request(f"vitrines?user_id=eq.{data.get('user_id')}&select=id")
            
            if existing and isinstance(existing, list) and len(existing) > 0:
                # Atualizar
                vitrine_id = existing[0]['id']
                result = supabase_request(f'vitrines?id=eq.{vitrine_id}', 'PATCH', vitrine_data)
            else:
                # Criar
                result = supabase_request('vitrines', 'POST', vitrine_data)
            
            if 'error' in result:
                response = {'success': False, 'message': str(result['error'])}
            else:
                vitrine = result[0] if isinstance(result, list) else result
                response = {'success': True, 'message': 'Vitrine salva!', 'vitrine': vitrine}
        
        # Criar produto
        elif path == '/api/produtos':
            produto_data = {
                'vitrine_id': data.get('vitrine_id'),
                'name': data.get('name'),
                'description': data.get('description', ''),
                'price': data.get('price'),
                'year': data.get('year'),
                'km': data.get('km'),
                'color': data.get('color', ''),
                'image_url': data.get('image_url', ''),
                'images': data.get('images', ''),
                'is_active': True
            }
            result = supabase_request('produtos', 'POST', produto_data)
            if 'error' in result:
                response = {'success': False, 'message': str(result['error'])}
            else:
                produto = result[0] if isinstance(result, list) else result
                response = {'success': True, 'message': 'Produto adicionado!', 'produto': produto}
        
        else:
            response = {'success': False, 'message': 'Endpoint não encontrado'}
        
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode())
    
    def do_DELETE(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        
        path = self.path
        
        # Deletar produto
        if '/api/produtos/' in path:
            produto_id = path.split('/api/produtos/')[-1]
            result = supabase_request(f'produtos?id=eq.{produto_id}', 'DELETE')
            response = {'success': True, 'message': 'Produto removido!'}
        else:
            response = {'success': False, 'message': 'Endpoint não encontrado'}
        
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode())
