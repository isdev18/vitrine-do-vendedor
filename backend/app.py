"""
Vitrine do Vendedor - Backend API (Flask)
Servidor principal - Produção (Railway)
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime

# Carregar variáveis de ambiente
from dotenv import load_dotenv
load_dotenv()

# Criar app Flask
app = Flask(__name__)

# ==========================================
# CONFIGURAÇÕES
# ==========================================
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'vitrine-vendedor-secret-2026')

# Database - SQLite local (para produção Railway, dados são efêmeros)
instance_path = os.path.join(os.getcwd(), 'instance')
os.makedirs(instance_path, exist_ok=True)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{instance_path}/vitrine_vendedor.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_AS_ASCII'] = False

# JWT Config
JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'jwt-vitrine-vendedor-secret-2026')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRE_HOURS = 24

# Planos
PLANS = {
    'basico': {'name': 'Básico', 'price': 49.90, 'max_products': 10},
    'profissional': {'name': 'Profissional', 'price': 89.90, 'max_products': 50},
    'premium': {'name': 'Premium', 'price': 149.90, 'max_products': 999}
}

# ==========================================
# CORS - Permitir frontend
# ==========================================
FRONTEND_URL = os.getenv('FRONTEND_URL', '*')
CORS(app, origins=[
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    FRONTEND_URL,
    "*"
], supports_credentials=True)

# ==========================================
# DATABASE
# ==========================================
from extensions import db
db.init_app(app)

# Inicializar banco (com tratamento de erro para produção)
with app.app_context():
    try:
        from models import User, Vitrine, Produto
        db.create_all()
        app.logger.info("Banco de dados inicializado com sucesso")
    except Exception as e:
        app.logger.error(f"Erro ao inicializar banco: {e}")
        # Não crashar o app em produção

print("🚀 App Flask pronto para iniciar!")


# ==========================================
# UTILITÁRIOS
# ==========================================
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import timedelta
from functools import wraps


def generate_token(user_id):
    """Gerar token JWT"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token):
    """Verificar token JWT"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except:
        return None


def token_required(f):
    """Decorator para rotas protegidas"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'success': False, 'message': 'Token não fornecido'}), 401
        
        user_id = verify_token(token)
        if not user_id:
            return jsonify({'success': False, 'message': 'Token inválido'}), 401
        
        return f(user_id, *args, **kwargs)
    return decorated


def generate_slug(text):
    """Gerar slug a partir de texto"""
    import re
    text = text.lower().strip()
    text = re.sub(r'[àáâãäå]', 'a', text)
    text = re.sub(r'[èéêë]', 'e', text)
    text = re.sub(r'[ìíîï]', 'i', text)
    text = re.sub(r'[òóôõö]', 'o', text)
    text = re.sub(r'[ùúûü]', 'u', text)
    text = re.sub(r'[ç]', 'c', text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')


# ==========================================
# ROTAS - STATUS
# ==========================================
@app.route('/')
def index():
    return jsonify({
        'success': True,
        'message': '🏍️ Vitrine do Vendedor API está online!',
        'version': '1.0.0'
    })


@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'vitrine-honda-api',
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/status')
def status():
    return jsonify({
        'success': True,
        'api': {'name': 'Vitrine do Vendedor API', 'version': '1.0.0', 'status': 'operational'},
        'plans': PLANS,
        'trial_days': 7
    })


# ==========================================
# ROTAS - AUTENTICAÇÃO
# ==========================================
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validar dados
    if not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Nome, email e senha são obrigatórios'}), 400
    
    # Verificar se email já existe
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'message': 'Email já cadastrado'}), 400
    
    # Criar usuário
    user = User(
        name=data['name'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        phone=data.get('phone', '')
    )
    db.session.add(user)
    db.session.commit()
    
    # Observação: o esquema atual não inclui tabela de assinaturas.
    
    # Gerar token
    token = generate_token(user.id)
    
    return jsonify({
        'success': True,
        'message': 'Cadastro realizado com sucesso!',
        'access_token': token,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email
        }
    })


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Email e senha são obrigatórios'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'success': False, 'message': 'Email ou senha incorretos'}), 401
    
    if user.status == 'blocked':
        return jsonify({'success': False, 'message': 'Conta bloqueada'}), 403
    
    token = generate_token(user.id)
    
    return jsonify({
        'success': True,
        'message': 'Login realizado com sucesso!',
        'access_token': token,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }
    })


@app.route('/api/auth/me')
@token_required
def get_me(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404
    
    return jsonify({
        'success': True,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'status': user.status,
            'created_at': user.created_at.isoformat()
        }
    })


# ==========================================
# ROTAS - USUÁRIO
# ==========================================
@app.route('/api/user/profile', methods=['GET', 'PUT'])
@token_required
def profile(user_id):
    user = User.query.get(user_id)
    
    if request.method == 'GET':
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'phone': user.phone
            }
        })
    
    # PUT - atualizar perfil
    data = request.get_json()
    if data.get('name'):
        user.name = data['name']
    if data.get('phone'):
        user.phone = data['phone']
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Perfil atualizado!'})


@app.route('/api/user/dashboard')
@token_required
def dashboard(user_id):
    user = User.query.get(user_id)
    vitrine = Vitrine.query.filter_by(user_id=user_id).first()
    subscription = None
    
    produtos_count = 0
    total_views = 0
    whatsapp_clicks = 0
    
    if vitrine:
        produtos_count = Produto.query.filter_by(vitrine_id=vitrine.id).count()
        total_views = vitrine.views
        whatsapp_clicks = vitrine.whatsapp_clicks
    
    return jsonify({
        'success': True,
        'dashboard': {
            'user': {'name': user.name, 'email': user.email},
            'vitrine': {
                'exists': vitrine is not None,
                'name': vitrine.name if vitrine else None,
                'slug': vitrine.slug if vitrine else None,
                'is_active': vitrine.is_active if vitrine else False
            },
            'subscription': {
                'plan': subscription.plan if subscription else 'basico',
                'status': subscription.status if subscription else 'none',
                'trial_end': subscription.trial_end.isoformat() if subscription and subscription.trial_end else None
            },
            'stats': {
                'produtos': produtos_count,
                'views': total_views,
                'whatsapp_clicks': whatsapp_clicks
            }
        }
    })


# ==========================================
# ROTAS - VITRINE
# ==========================================
@app.route('/api/vitrine', methods=['GET', 'POST', 'PUT'])
@token_required
def vitrine_crud(user_id):
    if request.method == 'GET':
        vitrine = Vitrine.query.filter_by(user_id=user_id).first()
        if not vitrine:
            return jsonify({'success': False, 'message': 'Vitrine não encontrada'}), 404
        
        return jsonify({
            'success': True,
            'vitrine': {
                'id': vitrine.id,
                'name': vitrine.name,
                'slug': vitrine.slug,
                'description': vitrine.description,
                'logo_url': vitrine.logo_url,
                'banner_url': vitrine.banner_url,
                'primary_color': vitrine.primary_color,
                'whatsapp': vitrine.whatsapp,
                'instagram': vitrine.instagram,
                'address': vitrine.address,
                'city': vitrine.city,
                'state': vitrine.state,
                'is_active': vitrine.is_active,
                'views': vitrine.views
            }
        })
    
    if request.method == 'POST':
        # Verificar se já tem vitrine
        if Vitrine.query.filter_by(user_id=user_id).first():
            return jsonify({'success': False, 'message': 'Você já possui uma vitrine'}), 400
        
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'success': False, 'message': 'Nome da vitrine é obrigatório'}), 400
        
        # Gerar slug único
        slug = generate_slug(data['name'])
        base_slug = slug
        counter = 1
        while Vitrine.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        vitrine = Vitrine(
            user_id=user_id,
            name=data['name'],
            slug=slug,
            description=data.get('description', ''),
            whatsapp=data.get('whatsapp', ''),
            instagram=data.get('instagram', ''),
            address=data.get('address', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            primary_color=data.get('primary_color', '#e63946')
        )
        db.session.add(vitrine)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Vitrine criada com sucesso!',
            'vitrine': {'id': vitrine.id, 'slug': vitrine.slug}
        })
    
    if request.method == 'PUT':
        vitrine = Vitrine.query.filter_by(user_id=user_id).first()
        if not vitrine:
            return jsonify({'success': False, 'message': 'Vitrine não encontrada'}), 404
        
        data = request.get_json()
        
        if data.get('name'):
            vitrine.name = data['name']
        if data.get('description'):
            vitrine.description = data['description']
        if data.get('whatsapp'):
            vitrine.whatsapp = data['whatsapp']
        if data.get('instagram'):
            vitrine.instagram = data['instagram']
        if data.get('address'):
            vitrine.address = data['address']
        if data.get('city'):
            vitrine.city = data['city']
        if data.get('state'):
            vitrine.state = data['state']
        if data.get('primary_color'):
            vitrine.primary_color = data['primary_color']
        if data.get('logo_url'):
            vitrine.logo_url = data['logo_url']
        if data.get('banner_url'):
            vitrine.banner_url = data['banner_url']
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Vitrine atualizada!'})


@app.route('/api/vitrine/public/<slug>')
def vitrine_public(slug):
    vitrine = Vitrine.query.filter_by(slug=slug).first()
    
    if not vitrine or not vitrine.is_active:
        return jsonify({'success': False, 'message': 'Vitrine não encontrada'}), 404
    
    # Incrementar views
    vitrine.views += 1
    db.session.commit()
    
    # Buscar produtos ativos
    produtos = Produto.query.filter_by(vitrine_id=vitrine.id, is_active=True).all()
    
    return jsonify({
        'success': True,
        'vitrine': {
            'name': vitrine.name,
            'slug': vitrine.slug,
            'description': vitrine.description,
            'logo_url': vitrine.logo_url,
            'banner_url': vitrine.banner_url,
            'primary_color': vitrine.primary_color,
            'whatsapp': vitrine.whatsapp,
            'instagram': vitrine.instagram,
            'address': vitrine.address,
            'city': vitrine.city,
            'state': vitrine.state
        },
        'produtos': [{
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'price': p.price,
            'year': p.year,
            'km': p.km,
            'color': p.color,
            'image_url': p.image_url,
            'is_featured': p.is_featured
        } for p in produtos]
    })


@app.route('/api/vitrine/<int:vitrine_id>/whatsapp-click', methods=['POST'])
def whatsapp_click(vitrine_id):
    vitrine = Vitrine.query.get(vitrine_id)
    if vitrine:
        vitrine.whatsapp_clicks += 1
        db.session.commit()
    return jsonify({'success': True})


# ==========================================
# ROTAS - PRODUTOS
# ==========================================
@app.route('/api/products', methods=['GET', 'POST'])
@token_required
def produtos_list(user_id):
    vitrine = Vitrine.query.filter_by(user_id=user_id).first()
    
    if not vitrine:
        return jsonify({'success': False, 'message': 'Crie uma vitrine primeiro'}), 400
    
    if request.method == 'GET':
        produtos = Produto.query.filter_by(vitrine_id=vitrine.id).all()
        
        return jsonify({
            'success': True,
            'produtos': [{
                'id': p.id,
                'name': p.name,
                'description': p.description,
                'price': p.price,
                'year': p.year,
                'km': p.km,
                'color': p.color,
                'image_url': p.image_url,
                'is_featured': p.is_featured,
                'is_active': p.is_active,
                'views': p.views
            } for p in produtos]
        })
    
    if request.method == 'POST':
        # Verificar limite de produtos (sem tabela de assinaturas, usa plano padrão)
        plan = 'basico'
        max_products = PLANS[plan]['max_products']
        
        current_count = Produto.query.filter_by(vitrine_id=vitrine.id).count()
        if current_count >= max_products:
            return jsonify({
                'success': False,
                'message': f'Limite de {max_products} produtos atingido. Faça upgrade do plano!'
            }), 400
        
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'success': False, 'message': 'Nome do produto é obrigatório'}), 400
        
        produto = Produto(
            vitrine_id=vitrine.id,
            name=data['name'],
            description=data.get('description', ''),
            price=data.get('price'),
            year=data.get('year'),
            km=data.get('km'),
            color=data.get('color', ''),
            image_url=data.get('image_url', ''),
            is_featured=data.get('is_featured', False)
        )
        db.session.add(produto)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Produto cadastrado!',
            'produto': {'id': produto.id}
        })


@app.route('/api/products/<int:product_id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def produto_detail(user_id, product_id):
    vitrine = Vitrine.query.filter_by(user_id=user_id).first()
    if not vitrine:
        return jsonify({'success': False, 'message': 'Vitrine não encontrada'}), 404
    
    produto = Produto.query.filter_by(id=product_id, vitrine_id=vitrine.id).first()
    if not produto:
        return jsonify({'success': False, 'message': 'Produto não encontrado'}), 404
    
    if request.method == 'GET':
        return jsonify({
            'success': True,
            'produto': {
                'id': produto.id,
                'name': produto.name,
                'description': produto.description,
                'price': produto.price,
                'year': produto.year,
                'km': produto.km,
                'color': produto.color,
                'image_url': produto.image_url,
                'is_featured': produto.is_featured,
                'is_active': produto.is_active
            }
        })
    
    if request.method == 'PUT':
        data = request.get_json()
        
        if data.get('name'):
            produto.name = data['name']
        if data.get('description'):
            produto.description = data['description']
        if 'price' in data:
            produto.price = data['price']
        if 'year' in data:
            produto.year = data['year']
        if 'km' in data:
            produto.km = data['km']
        if data.get('color'):
            produto.color = data['color']
        if data.get('image_url'):
            produto.image_url = data['image_url']
        if 'is_featured' in data:
            produto.is_featured = data['is_featured']
        if 'is_active' in data:
            produto.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Produto atualizado!'})
    
    if request.method == 'DELETE':
        db.session.delete(produto)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Produto excluído!'})


# ==========================================
# ROTAS - ASSINATURA
# ==========================================
@app.route('/api/subscription/status')
@token_required
def subscription_status(user_id):
    # Tabela de assinaturas não está presente neste esquema; retornar None
    return jsonify({'success': True, 'subscription': None})


@app.route('/api/subscription/plans')
def subscription_plans():
    return jsonify({
        'success': True,
        'plans': [
            {'id': 'basico', **PLANS['basico']},
            {'id': 'profissional', **PLANS['profissional']},
            {'id': 'premium', **PLANS['premium']}
        ]
    })


@app.route('/api/subscription/select-plan', methods=['POST'])
@token_required
def select_plan(user_id):
    data = request.get_json()
    plan = data.get('plan', 'basico')
    
    if plan not in PLANS:
        return jsonify({'success': False, 'message': 'Plano inválido'}), 400
    
    # A gestão de assinaturas não está implementada no esquema de banco atual.
    return jsonify({
        'success': False,
        'message': 'Gestão de assinaturas não implementada no banco de dados atual.'
    }), 400


# ==========================================
# HANDLER DE ERROS
# ==========================================
@app.errorhandler(404)
def not_found(e):
    return jsonify({'success': False, 'message': 'Endpoint não encontrado'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'success': False, 'message': 'Erro interno do servidor'}), 500


# ==========================================
# INICIALIZAÇÃO
# ==========================================
with app.app_context():
    db.create_all()
    print("✅ Banco de dados inicializado!")

print("🚀 App Flask pronto para iniciar!")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    print(f"🚀 Rodando na porta {port}")
    app.run(host="0.0.0.0", port=port)
