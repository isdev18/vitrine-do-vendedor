
from flask import Blueprint, request, jsonify
from services.user_service import UserService

user_bp = Blueprint('user', __name__)
user_service = UserService()

def safe_json_response(result, success_code=200, fail_code=400):
    import json as _json
    if result is None:
        return jsonify({"erro": "Resposta vazia do backend"}), 500
    if isinstance(result, dict):
        return jsonify(result), success_code if result.get('ok') or result.get('status') == 'ok' else fail_code
    try:
        parsed = _json.loads(result)
        if isinstance(parsed, dict):
            return jsonify(parsed), success_code if parsed.get('ok') or parsed.get('status') == 'ok' else fail_code
        return jsonify({"erro": "Resposta não é dict", "raw": str(result)}), 500
    except Exception:
        return jsonify({"erro": "Resposta inesperada do backend", "raw": str(result)}), 500

@user_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        result = user_service.register(data)
        return safe_json_response(result, success_code=201, fail_code=400)
    except Exception as e:
        import traceback
        return jsonify({"erro": "Exceção não tratada no backend", "detalhe": str(e), "trace": traceback.format_exc()}), 500

@user_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        result = user_service.login(data)
        return safe_json_response(result, success_code=200, fail_code=401)
    except Exception as e:
        import traceback
        return jsonify({"erro": "Exceção não tratada no backend", "detalhe": str(e), "trace": traceback.format_exc()}), 500
