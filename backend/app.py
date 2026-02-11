import logging
import os
import traceback

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from database_api import GoogleSheetsDB


BASE_DIR = os.path.dirname(__file__)
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))

app = Flask(__name__, static_folder=None)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")
CORS(
    app,
    resources={r"/*": {"origins": ALLOWED_ORIGINS}},
    supports_credentials=False,
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

API_URL = os.getenv(
    "GOOGLE_SHEETS_API",
    "https://script.google.com/macros/s/AKfycbxXm7cKe12c9KuN790jIhrqTDKEUfsxwb_vzcgJHt71NhJduP8qod70SnK3FZ5VjBpK/exec",
)
gsheets = GoogleSheetsDB(API_URL)

app.logger.info("Flask API starting")
app.logger.info("Google Sheets endpoint: %s", API_URL)


def is_api_path(path: str) -> bool:
    if not path:
        return False
    normalized = "/" + path.lstrip("/")
    return normalized == "/register" or normalized.startswith("/auth") or normalized.startswith("/api")


def no_cache(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.before_request
def request_log():
    app.logger.info(
        "Request method=%s path=%s origin=%s content_type=%s",
        request.method,
        request.path,
        request.headers.get("Origin"),
        request.headers.get("Content-Type"),
    )


@app.after_request
def after_request(response):
    return no_cache(response)


@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/auth/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return "", 204

    try:
        data = request.get_json(silent=True) or {}
        email = (data.get("email") or "").strip()
        senha = data.get("senha") or ""

        if not email or not senha:
            return jsonify({"success": False, "message": "Email e senha sao obrigatorios"}), 400

        resposta = gsheets.send_request({"acao": "login", "email": email, "senha": senha})

        if resposta.get("status") == "ok" and resposta.get("user"):
            import base64
            import time

            token = base64.b64encode(f"{email}:{time.time()}".encode()).decode()
            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Login realizado com sucesso",
                        "user": resposta["user"],
                        "token": token,
                    }
                ),
                200,
            )

        return (
            jsonify(
                {
                    "success": False,
                    "message": resposta.get("msg") or resposta.get("erro") or "Email ou senha incorretos",
                }
            ),
            401,
        )
    except Exception as exc:
        app.logger.exception("Erro no login")
        return jsonify({"success": False, "message": str(exc), "trace": traceback.format_exc()}), 500


@app.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return "", 204

    try:
        data = request.get_json(silent=True) or {}
        nome = (data.get("nome") or "").strip()
        email = (data.get("email") or "").strip().lower()
        senha = data.get("senha") or ""
        telefone = (data.get("telefone") or "").strip()

        missing = [field for field, value in {"nome": nome, "email": email, "senha": senha}.items() if not value]
        if missing:
            return jsonify({"status": "erro", "msg": f"Campos obrigatorios ausentes: {', '.join(missing)}"}), 400

        resposta = gsheets.send_request(
            {
                "acao": "criar_usuario",
                "nome": nome,
                "email": email,
                "senha": senha,
                "telefone": telefone,
            }
        )

        status_code = 201 if resposta.get("status") == "ok" else 400
        return jsonify(resposta), status_code
    except Exception as exc:
        app.logger.exception("Erro no register")
        return jsonify({"erro": str(exc), "trace": traceback.format_exc()}), 500


@app.route("/teste-sheets", methods=["GET"])
def teste_sheets():
    payload = {
        "acao": "criar_usuario",
        "nome": "teste_flask",
        "email": "teste@teste.com",
        "senha": "123",
        "telefone": "000",
    }
    resposta = gsheets.send_request(payload)
    return jsonify(resposta), 200


@app.errorhandler(404)
def not_found(error):
    if is_api_path(request.path):
        return jsonify({"error": "Not Found", "path": request.path}), 404
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.errorhandler(405)
def method_not_allowed(error):
    app.logger.warning("405 method=%s path=%s", request.method, request.path)
    if is_api_path(request.path):
        return jsonify({"error": "Method Not Allowed", "method": request.method, "path": request.path}), 405
    return jsonify({"error": "Method Not Allowed", "path": request.path}), 405


@app.route("/", defaults={"path": ""}, methods=["GET"])
@app.route("/<path:path>", methods=["GET"])
def serve_frontend(path):
    if is_api_path(path):
        return jsonify({"error": "Not Found"}), 404

    if not path:
        return send_from_directory(FRONTEND_DIR, "index.html")

    full_path = os.path.join(FRONTEND_DIR, path)
    if os.path.exists(full_path) and os.path.isfile(full_path):
        return send_from_directory(FRONTEND_DIR, path)

    return send_from_directory(FRONTEND_DIR, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.logger.info("Running on port %s", port)
    app.run(host="0.0.0.0", port=port)
