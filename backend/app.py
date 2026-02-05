import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

database_url = os.environ.get("DATABASE_URL")
if not database_url:
    raise ValueError("DATABASE_URL não definida")

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)

try:
    with app.app_context():
        db.engine.execute("SELECT 1")
        app.logger.info("Conexão com PostgreSQL estabelecida")
except Exception as e:
    app.logger.error(f"Erro na conexão com banco: {e}")
    raise

@app.route('/')
def home():
    return jsonify({"message": "API ONLINE 🚀"})

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Erro interno"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
