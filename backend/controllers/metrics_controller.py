from flask import Blueprint, request, jsonify
from services.metrics_service import MetricsService

metrics_bp = Blueprint('metrics', __name__)
metrics_service = MetricsService()

@metrics_bp.route('/metrics/view', methods=['POST'])
def somar_view():
    data = request.get_json()
    result = metrics_service.somar_view(data)
    return jsonify(result), 200 if result.get('ok') else 400

@metrics_bp.route('/metrics/lead', methods=['POST'])
def salvar_lead():
    data = request.get_json()
    result = metrics_service.salvar_lead(data)
    return jsonify(result), 201 if result.get('ok') else 400
