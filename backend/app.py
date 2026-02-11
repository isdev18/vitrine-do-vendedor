# =========================
# IMPORTS E APP NO TOPO
# =========================
import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from database_api import GoogleSheetsDB

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
app = Flask(__name__, static_folder=None)

# =========================
# ROTA DE LOGIN VIA FRONTEND
# =========================
@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        senha = data.get('senha')
        resposta = gsheets.send_request({
            "acao": "login",
            "email": email,
            "senha": senha
        })
        # Esperado: resposta = {status: 'ok', user: {...}, ...} ou erro
        if resposta.get('status') == 'ok' and resposta.get('user'):
            # Gera token fake só para manter compatibilidade
            import base64, time
            token = base64.b64encode(f"{email}:{senha}:{time.time()}".encode()).decode()
            return jsonify({
                "success": True,
                "message": "Login realizado com sucesso!",
                "user": resposta['user'],
                "token": token
            }), 200
        return jsonify({
            "success": False,
            "message": resposta.get('msg') or resposta.get('erro') or 'Email ou senha incorretos'
        }), 401
    except Exception as e:
        import traceback
        return jsonify({"success": False, "message": str(e), "trace": traceback.format_exc()}), 500
CORS(app)

# =========================
# ROTA DE CADASTRO VIA FRONTEND
# =========================
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        nome = data.get('nome')
        email = data.get('email')
        senha = data.get('senha')
        telefone = data.get('telefone')
        resposta = gsheets.send_request({
            "acao": "criar_usuario",
            "nome": nome,
            "email": email,
            "senha": senha,
            "telefone": telefone
        })
        return jsonify(resposta), 201 if resposta.get('status') == 'ok' else 400
    except Exception as e:
        import traceback
        return jsonify({"erro": str(e), "trace": traceback.format_exc()}), 500

print("🚀 INICIANDO API FLASK...")

# URL do Apps Script (mesma do test.py)

# URL atualizada do Apps Script fornecida pelo usuário
API_URL = os.getenv(
    'GOOGLE_SHEETS_API',
    'https://script.google.com/macros/s/AKfycbxXm7cKe12c9KuN790jIhrqTDKEUfsxwb_vzcgJHt71NhJduP8qod70SnK3FZ5VjBpK/exec'
)

print("🌐 API SHEETS:", API_URL)

# Conexão com Google Sheets
gsheets = GoogleSheetsDB(API_URL)


# =========================
# SERVE FRONTEND (HTML, CSS, JS)
# =========================
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # Se for arquivo estático (js, css, imagens)
    static_exts = ('.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp', '.json', '.map')
    if path and path.endswith(static_exts):
        return send_from_directory(FRONTEND_DIR, path)
    # Se for um dos HTMLs
    if path and os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    # Fallback: index.html
    return send_from_directory(FRONTEND_DIR, 'index.html')

# =========================
# TESTE DIRETO IGUAL test.py
# =========================
@app.route('/teste-sheets', methods=['GET'])
def teste_sheets():
    print("🔥 ROTA /teste-sheets CHAMADA")
    payload = {
        "acao": "criar_usuario",
        "nome": "teste_flask",
        "email": "teste@teste.com",
        "senha": "123",
        "telefone": "000"
    }
    print("📤 ENVIANDO PARA SHEETS:", payload)
    resposta = gsheets.send_request(payload)
    print("📥 RESPOSTA:", resposta)
    return resposta, 200, {'Content-Type': 'application/json'}

# =========================
# ERRO INTERNO
# =========================
@app.errorhandler(500)
def internal_error(error):
    print("❌ ERRO 500:", error)
    return jsonify({"error": "Erro interno no Flask"}), 500

# =========================
# SEM CACHE (IMPORTANTE)
# =========================
@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# =========================
# START
# =========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)

